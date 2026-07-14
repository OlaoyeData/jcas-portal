from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings

from app.core.dependencies import get_db, get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.manuscript import Manuscript, ManuscriptStatus
from app.models.review import ReviewAssignment, Review, ReviewStatus, ReviewRecommendation
from app.schemas.review import (
    ReviewAssignmentCreate, ReviewAssignmentOut,
    ReviewCreate, ReviewOut, ReviewerInvitationResponse,
)
from app.services.manuscript_service import notify_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

DEFAULT_REVIEW_DAYS = 21


# ── Helper ───────────────────────────────────────────────────────────────

def _get_assignment_or_404(db: Session, assignment_id: int) -> ReviewAssignment:
    a = (
        db.query(ReviewAssignment)
        .options(joinedload(ReviewAssignment.review), joinedload(ReviewAssignment.reviewer))
        .filter(ReviewAssignment.id == assignment_id)
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Review assignment not found")
    return a


# ── Editor: manage assignments ────────────────────────────────────────────
@router.post("/assignments", response_model=ReviewAssignmentOut, status_code=201)
def invite_reviewer(
    payload: ReviewAssignmentCreate,
    manuscript_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    """Invite a reviewer to assess a manuscript (editor or editor-in-chief).
    Can be called multiple times with different reviewer_id values to set up
    multiple parallel reviewers (double-blind review) on the same manuscript."""
    ms = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Manuscript not found")
    if ms.status not in (ManuscriptStatus.UNDER_REVIEW, ManuscriptStatus.EDITOR_ASSIGNED):
        raise HTTPException(
            status_code=400,
            detail="Manuscript must be in EDITOR_ASSIGNED or UNDER_REVIEW status",
        )

    # Prevent duplicate active invitations
    existing = db.query(ReviewAssignment).filter(
        ReviewAssignment.manuscript_id == manuscript_id,
        ReviewAssignment.reviewer_id == payload.reviewer_id,
        ReviewAssignment.status.notin_([ReviewStatus.DECLINED]),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Reviewer already invited for this manuscript")

    reviewer = db.query(User).filter(
        User.id == payload.reviewer_id, User.role == UserRole.REVIEWER
    ).first()
    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer not found")

    deadline = payload.deadline or (
        datetime.now(timezone.utc) + timedelta(days=DEFAULT_REVIEW_DAYS)
    )
    assignment = ReviewAssignment(
        manuscript_id=manuscript_id,
        reviewer_id=payload.reviewer_id,
        assigned_by=current_user.id,
        status=ReviewStatus.INVITED,
        deadline=deadline,
    )
    db.add(assignment)
    db.flush()

    notify_user(
        db, assignment.reviewer_id, "review_invitation",
        f"Review Invitation: {ms.manuscript_id}",
        f"You have been invited to review '{ms.title[:80]}'.",
    )
    if reviewer.wants_notification("notify_on_invitation"):
        from app.utils.email import send_review_invitation_email
        send_review_invitation_email(
            reviewer_email=reviewer.email,
            reviewer_name=reviewer.name,
            manuscript_title=ms.title,
            deadline=str(assignment.deadline.date()) if assignment.deadline else "Not specified",
            accept_url=f"{settings.FRONTEND_URL}/dashboard/reviewer/invitations",
            db=db,
        )
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/assignments", response_model=List[ReviewAssignmentOut])
def list_assignments_for_manuscript(
    manuscript_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR)),
):
    return (
        db.query(ReviewAssignment)
        .filter(ReviewAssignment.manuscript_id == manuscript_id)
        .order_by(ReviewAssignment.assigned_at)
        .all()
    )


@router.delete("/assignments/{assignment_id}", status_code=204)
def cancel_invitation(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.EDITOR)),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    if assignment.status == ReviewStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed review")
    db.delete(assignment)
    db.commit()


# ── Reviewer: manage own invitations ─────────────────────────────────────

@router.get("/my-invitations", response_model=List[ReviewAssignmentOut])
def get_my_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REVIEWER)),
):
    return (
        db.query(ReviewAssignment)
        .filter(
            ReviewAssignment.reviewer_id == current_user.id,
            ReviewAssignment.status == ReviewStatus.INVITED,
        )
        .order_by(ReviewAssignment.assigned_at.desc())
        .all()
    )


@router.get("/my-active", response_model=List[ReviewAssignmentOut])
def get_my_active_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REVIEWER)),
):
    return (
        db.query(ReviewAssignment)
        .filter(
            ReviewAssignment.reviewer_id == current_user.id,
            ReviewAssignment.status.in_([ReviewStatus.ACCEPTED, ReviewStatus.IN_PROGRESS]),
        )
        .order_by(ReviewAssignment.deadline)
        .all()
    )


@router.get("/my-history", response_model=List[ReviewAssignmentOut])
def get_my_review_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REVIEWER)),
):
    return (
        db.query(ReviewAssignment)
        .filter(
            ReviewAssignment.reviewer_id == current_user.id,
            ReviewAssignment.status == ReviewStatus.SUBMITTED,
        )
        .order_by(ReviewAssignment.completed_at.desc())
        .all()
    )


@router.post("/assignments/{assignment_id}/respond", response_model=ReviewAssignmentOut)
def respond_to_invitation(
    assignment_id: int,
    payload: ReviewerInvitationResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REVIEWER)),
):
    """Accept or decline a review invitation."""
    assignment = _get_assignment_or_404(db, assignment_id)

    if assignment.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="This invitation is not addressed to you")
    if assignment.status != ReviewStatus.INVITED:
        raise HTTPException(status_code=400, detail="Invitation has already been responded to")

    assignment.responded_at = datetime.now(timezone.utc)

    if payload.accept:
        assignment.status = ReviewStatus.ACCEPTED
        notify_user(
            db,
            assignment.manuscript.editor_id or assignment.assigned_by,
            "review_accepted",
            "Reviewer Accepted Invitation",
            f"{current_user.name} accepted review for manuscript #{assignment.manuscript_id}.",
        )
        from app.utils.email import send_reviewer_assigned_email
        send_reviewer_assigned_email(
            reviewer_email=current_user.email,
            reviewer_name=current_user.name,
            manuscript_title=assignment.manuscript.title,
            manuscript_id=assignment.manuscript.manuscript_id,
            deadline=str(assignment.deadline.date()) if assignment.deadline else "Not specified",
            dashboard_url=f"{settings.FRONTEND_URL}/dashboard/reviewer/active",
            db=db,
        )
    else:
        assignment.status = ReviewStatus.DECLINED
        assignment.decline_reason = payload.decline_reason

    db.commit()
    db.refresh(assignment)
    return assignment


# ── Reviewer: write / update a review ────────────────────────────────────

@router.get("/assignments/{assignment_id}/review", response_model=ReviewOut)
def get_review(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REVIEWER)),
):
    assignment = _get_assignment_or_404(db, assignment_id)
    if assignment.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not assignment.review:
        raise HTTPException(status_code=404, detail="No review started yet")
    return assignment.review


@router.put("/assignments/{assignment_id}/review", response_model=ReviewOut)
def save_review(
    assignment_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.REVIEWER)),
):
    """Create or update a review (draft or final submission)."""
    assignment = _get_assignment_or_404(db, assignment_id)

    if assignment.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if assignment.status not in (ReviewStatus.ACCEPTED, ReviewStatus.IN_PROGRESS):
        raise HTTPException(
            status_code=400,
            detail="You must accept the invitation before writing a review",
        )

    # Validate required fields when submitting (not draft)
    if not payload.is_draft:
        missing = []
        if not payload.recommendation:
            missing.append("recommendation")
        if not payload.comments_to_author:
            missing.append("comments_to_author")
        if payload.score_originality is None:
            missing.append("score_originality")
        if payload.score_technical is None:
            missing.append("score_technical")
        if payload.score_clarity is None:
            missing.append("score_clarity")
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Required fields missing for submission: {missing}",
            )

    # Upsert
    review = assignment.review
    if not review:
        review = Review(assignment_id=assignment_id)
        db.add(review)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)

    # Mark as in-progress the first time they start writing
    if assignment.status == ReviewStatus.ACCEPTED:
        assignment.status = ReviewStatus.IN_PROGRESS

    # Final submission
    if not payload.is_draft:
        review.submitted_at = datetime.now(timezone.utc)
        assignment.status = ReviewStatus.SUBMITTED
        assignment.completed_at = datetime.now(timezone.utc)

        # Notify editor
        ms = assignment.manuscript
        completed_count = sum(
            1 for a in ms.review_assignments
            if a.status == ReviewStatus.SUBMITTED
        )
        total_count = len([
            a for a in ms.review_assignments
            if a.status != ReviewStatus.DECLINED
        ])

        notify_user(
            db,
            ms.editor_id or ms.submitter_id,
            "review_submitted",
            "Review Submitted",
            f"{current_user.name} submitted review {completed_count}/{total_count} "
            f"for '{ms.title[:60]}'.",
        )
        editor_user = ms.editor  # relationship on Manuscript; may be None if unassigned
        if editor_user and editor_user.wants_notification("notify_on_review_complete"):
            from app.utils.email import send_email
            send_email(
                to_email=editor_user.email,
                subject=f"JCAS — Review Submitted: {ms.manuscript_id}",
                html_body=f"""
                <p>Dear {editor_user.name},</p>
                <p>{current_user.name} has submitted a review ({completed_count}/{total_count})
                for manuscript "{ms.title}" (ID: {ms.manuscript_id}).</p>
                <p>Log in to your editor dashboard to view it.</p>
                <p>Best regards,<br>The JCAS System</p>
                """,
            )

        # If all reviewers done, flag as decision ready
        if completed_count >= total_count and total_count > 0:
            notify_user(
                db,
                ms.editor_id or ms.submitter_id,
                "decision_ready",
                "All Reviews Complete — Ready for Decision",
                f"All {total_count} reviews submitted for '{ms.title[:60]}'.",
            )

    db.commit()
    db.refresh(review)
    return review


# ── Editor: read submitted reviews ───────────────────────────────────────

@router.get("/manuscript/{manuscript_id}/reviews", response_model=List[ReviewOut])
def get_all_reviews_for_manuscript(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    """Editor (or editor-in-chief) can read all submitted reviews for a manuscript,
    including any supplementary files and whether each has been forwarded to the author."""
    assignments = (
        db.query(ReviewAssignment)
        .options(joinedload(ReviewAssignment.review))
        .filter(
            ReviewAssignment.manuscript_id == manuscript_id,
            ReviewAssignment.status == ReviewStatus.SUBMITTED,
        )
        .all()
    )
    return [a.review for a in assignments if a.review is not None]

@router.get("/manuscript/{manuscript_id}/author-reviews")
def get_reviews_for_author(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns submitted review comments visible to the manuscript's author.
    Editors and above see all fields; authors only see comments_to_author."""
    from app.models.manuscript import Manuscript
    ms = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Manuscript not found")

    is_editor = current_user.role in (UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
    if not is_editor and ms.submitter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    assignments = (
        db.query(ReviewAssignment)
        .filter(
            ReviewAssignment.manuscript_id == manuscript_id,
            ReviewAssignment.status == ReviewStatus.SUBMITTED,
        )
        .all()
    )

    results = []
    for idx, a in enumerate(assignments):
        if not a.review:
            continue
        r = a.review
        if is_editor:
            visible_files = [
                {"id": f.id, "filename": f.filename, "shared_with_author": f.shared_with_author}
                for f in (r.files or [])
            ]
        else:
            # Authors only ever see files the editor has explicitly forwarded.
            visible_files = [
                {"id": f.id, "filename": f.filename}
                for f in (r.files or []) if f.shared_with_author
            ]
        entry = {
            "reviewer_num": idx + 1,
            "round_number": a.round_number,
            "recommendation": r.recommendation,
            "comments_to_author": r.comments_to_author,
            "score_originality": r.score_originality,
            "score_technical": r.score_technical,
            "score_clarity": r.score_clarity,
            "score_references": r.score_references,
            "overall_score": r.overall_score,
            "submitted_at": r.submitted_at,
            "files": visible_files,
        }
        if is_editor:
            entry["comments_to_editor"] = r.comments_to_editor
        results.append(entry)
    return results


# ── Editor: forward a reviewer's file to the author ───────────────────────

@router.post("/files/{file_id}/share-with-author", status_code=200)
def share_review_file_with_author(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)),
):
    """Editor reviews a reviewer's supplementary file, then forwards it to
    the author. Files are never visible to the author until this is called."""
    from app.models.review import ReviewFile
    rf = (
        db.query(ReviewFile)
        .join(Review, ReviewFile.review_id == Review.id)
        .join(ReviewAssignment, Review.assignment_id == ReviewAssignment.id)
        .options(joinedload(ReviewFile.review))
        .filter(ReviewFile.id == file_id)
        .first()
    )
    if not rf:
        raise HTTPException(status_code=404, detail="File not found")

    assignment = rf.review.assignment
    ms = assignment.manuscript
    if current_user.role == UserRole.EDITOR and ms.editor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the assigned editor for this manuscript")

    rf.shared_with_author = True
    rf.shared_at = datetime.now(timezone.utc)
    db.commit()

    notify_user(
        db, ms.submitter_id, "reviewer_file_shared",
        "New Reviewer Attachment Available",
        f"The editor has shared a reviewer attachment ({rf.filename}) for '{ms.title[:60]}'.",
    )
    return {"detail": "File shared with author", "shared_at": rf.shared_at}


@router.get("/files/{file_id}/download")
def download_review_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Download a review's supplementary file.
    Editors/EiC/admin: always allowed. The reviewer who uploaded it: always allowed.
    The manuscript's author: only once the editor has forwarded it."""
    from app.models.review import ReviewFile
    from fastapi.responses import FileResponse

    rf = (
        db.query(ReviewFile)
        .join(Review, ReviewFile.review_id == Review.id)
        .join(ReviewAssignment, Review.assignment_id == ReviewAssignment.id)
        .options(joinedload(ReviewFile.review))
        .filter(ReviewFile.id == file_id)
        .first()
    )
    if not rf:
        raise HTTPException(status_code=404, detail="File not found")

    assignment = rf.review.assignment
    ms = assignment.manuscript
    is_editor = current_user.role in (UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN)
    is_uploader = assignment.reviewer_id == current_user.id
    is_author_with_access = ms.submitter_id == current_user.id and rf.shared_with_author

    if not (is_editor or is_uploader or is_author_with_access):
        raise HTTPException(status_code=403, detail="Access denied")

    if settings.USE_S3:
        from app.utils.storage import generate_download_url
        from fastapi.responses import RedirectResponse
        return RedirectResponse(generate_download_url(rf.file_path, filename=rf.filename))

    return FileResponse(rf.file_path, filename=rf.filename)


@router.post("/assignments/{assignment_id}/files", status_code=201)
async def upload_review_file(
    assignment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Reviewer uploads a supplementary file attached to their review."""
    from app.models.review import Review, ReviewFile
    from app.utils.files import save_upload
    assignment = _get_assignment_or_404(db, assignment_id)
    if assignment.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Attaching a file before any draft text exists shouldn't block the
    # reviewer — silently create the empty draft row it needs to attach to.
    if not assignment.review:
        draft = Review(assignment_id=assignment.id)
        db.add(draft)
        db.commit()
        db.refresh(assignment)

    stored_name, file_path, file_size = await save_upload(file, subfolder=f"review_{assignment_id}")
    rf = ReviewFile(
        review_id=assignment.review.id,
        filename=file.filename,
        stored_name=stored_name,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
    )
    db.add(rf)
    db.commit()
    db.refresh(rf)
    return {"id": rf.id, "filename": rf.filename, "file_size": rf.file_size}


@router.delete("/assignments/{assignment_id}/files/{file_id}", status_code=204)
def delete_review_file(
    assignment_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.models.review import ReviewFile
    assignment = _get_assignment_or_404(db, assignment_id)
    if assignment.reviewer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    rf = db.query(ReviewFile).filter(
        ReviewFile.id == file_id,
        ReviewFile.review_id == assignment.review.id,
    ).first()
    if not rf:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(rf)
    db.commit()

# ── Overdue reviews ───────────────────────────────────────────────────────

def _get_overdue_assignments(db: Session, current_user: User):
    q = db.query(ReviewAssignment).join(Manuscript).options(
        joinedload(ReviewAssignment.manuscript), joinedload(ReviewAssignment.reviewer)
    ).filter(
        ReviewAssignment.status.in_([ReviewStatus.ACCEPTED, ReviewStatus.IN_PROGRESS]),
        ReviewAssignment.deadline.isnot(None),
        ReviewAssignment.deadline < datetime.now(timezone.utc),
    )
    if current_user.role == UserRole.EDITOR:
        q = q.filter(Manuscript.editor_id == current_user.id)
    return q.all()


@router.get("/overdue", status_code=200)
def list_overdue_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    """Editor sees overdue reviews on their own manuscripts; EiC sees all."""
    overdue = _get_overdue_assignments(db, current_user)
    return [{
        "assignment_id": a.id,
        "manuscript_id": a.manuscript.manuscript_id,
        "manuscript_title": a.manuscript.title,
        "reviewer_name": a.reviewer.name,
        "reviewer_email": a.reviewer.email,
        "deadline": a.deadline,
    } for a in overdue]


@router.post("/overdue/notify", status_code=200)
def notify_me_of_overdue_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    """Manually trigger the overdue-reviews email now (respects notify_on_overdue).
    Written so a future scheduled job can call the same logic per-user, once one exists."""
    overdue = _get_overdue_assignments(db, current_user)
    if not overdue:
        return {"detail": "No overdue reviews.", "count": 0}
    if not current_user.wants_notification("notify_on_overdue"):
        return {"detail": "Overdue-review notifications are turned off in your settings.", "count": len(overdue)}

    from app.utils.email import send_email
    rows = "".join(
        f"<li>{a.manuscript.title[:80]} — reviewer {a.reviewer.name}, "
        f"due {a.deadline.date()}</li>"
        for a in overdue
    )
    send_email(
        to_email=current_user.email,
        subject=f"JCAS — {len(overdue)} Overdue Review(s)",
        html_body=f"""
        <p>Dear {current_user.name},</p>
        <p>You have {len(overdue)} review assignment(s) past their deadline:</p>
        <ul>{rows}</ul>
        <p>Best regards,<br>The JCAS System</p>
        """,
    )
    return {"detail": "Overdue-review summary sent to your email.", "count": len(overdue)}
