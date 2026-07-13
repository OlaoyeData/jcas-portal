from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload
from fastapi.responses import FileResponse
import os

from app.core.dependencies import get_db, get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.manuscript import (
    Manuscript, ManuscriptAuthor, ManuscriptFile,
    ManuscriptStatus, ManuscriptStatusHistory,
)
from app.schemas.manuscript import (
    ManuscriptCreate, ManuscriptUpdate, ManuscriptOut,
    ManuscriptSummary, EditorAssign, EditorDecision,
)
from app.services.manuscript_service import (
    generate_manuscript_id, record_status_change, notify_user,
)
from app.utils.files import save_upload
from app.models.payment import Payment
from pydantic import BaseModel
from typing import Optional

class PublishPayload(BaseModel):
    doi:        Optional[str] = None
    issue_id:   Optional[int] = None
    page_start: Optional[int] = None
    page_end:   Optional[int] = None


router = APIRouter(prefix="/manuscripts", tags=["Manuscripts"])

# ── Helper ───────────────────────────────────────────────────────────────

def _get_manuscript_or_404(db: Session, manuscript_id: int) -> Manuscript:
    ms = (
        db.query(Manuscript)
        .options(
            joinedload(Manuscript.co_authors),
            joinedload(Manuscript.files),
            joinedload(Manuscript.status_history),
        )
        .filter(Manuscript.id == manuscript_id)
        .first()
    )
    if not ms:
        raise HTTPException(status_code=404, detail="Manuscript not found")
    return ms


def _assert_owner_or_editor(ms: Manuscript, user: User) -> None:
    """Admin and EiC can access any manuscript.
    Regular editors can only access manuscripts explicitly assigned to them."""
    if user.role == UserRole.ADMIN or user.role == UserRole.EDITOR_IN_CHIEF:
        return
    if user.role == UserRole.EDITOR:
        if ms.editor_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        return
    if ms.submitter_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")


# ── Author endpoints ──────────────────────────────────────────────────────

@router.get("/my", response_model=List[ManuscriptSummary])
def list_my_manuscripts(
    status: Optional[ManuscriptStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return all manuscripts submitted by the current user."""
    q = db.query(Manuscript).filter(Manuscript.submitter_id == current_user.id)
    if status:
        q = q.filter(Manuscript.status == status)
    return q.order_by(Manuscript.created_at.desc()).all()


@router.post("/", response_model=ManuscriptOut, status_code=201)
def create_manuscript(
    payload: ManuscriptCreate,
    db: Session = Depends(get_db),
    # FIX: editors and EiC can also submit manuscripts
    current_user: User = Depends(require_role(UserRole.AUTHOR, UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    """Save a manuscript as a DRAFT"""
    ms = Manuscript(
        manuscript_id=generate_manuscript_id(db),
        title=payload.title,
        article_type=payload.article_type,
        abstract=payload.abstract,
        keywords=payload.keywords,
        subject_area=payload.subject_area,
        cover_letter=payload.cover_letter,
        policy_data=payload.policy_data,
        submitter_id=current_user.id,
        status=ManuscriptStatus.DRAFT,
    )
    db.add(ms)
    db.flush()

    for idx, a in enumerate(payload.co_authors):
        db.add(ManuscriptAuthor(
            manuscript_id=ms.id,
            name=a.name,
            email=a.email,
            affiliation=a.affiliation,
            orcid=a.orcid,
            is_corresponding=a.is_corresponding,
            author_order=idx,
        ))

    db.commit()
    db.refresh(ms)
    return _get_manuscript_or_404(db, ms.id)


@router.get("/{manuscript_id}", response_model=ManuscriptOut)
def get_manuscript(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)

    if current_user.role == UserRole.REVIEWER:
        from app.models.review import ReviewAssignment, ReviewStatus
        assignment = db.query(ReviewAssignment).filter(
            ReviewAssignment.manuscript_id == ms.id,
            ReviewAssignment.reviewer_id == current_user.id,
            ReviewAssignment.status.notin_([ReviewStatus.DECLINED]),
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        _assert_owner_or_editor(ms, current_user)

    return ms


@router.patch("/{manuscript_id}", response_model=ManuscriptOut)
def update_manuscript(
    manuscript_id: int,
    payload: ManuscriptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    _assert_owner_or_editor(ms, current_user)
    if ms.status not in (ManuscriptStatus.DRAFT, ManuscriptStatus.REVISION_REQUIRED):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit a manuscript with status '{ms.status.value}'",
        )
    for field, value in payload.model_dump(exclude_unset=True, exclude={"co_authors"}).items():
        setattr(ms, field, value)

    if payload.co_authors is not None:
        db.query(ManuscriptAuthor).filter(ManuscriptAuthor.manuscript_id == ms.id).delete()
        for idx, a in enumerate(payload.co_authors):
            db.add(ManuscriptAuthor(
                manuscript_id=ms.id, name=a.name, email=a.email,
                affiliation=a.affiliation, orcid=a.orcid,
                is_corresponding=a.is_corresponding, author_order=idx,
            ))

    db.commit()
    return _get_manuscript_or_404(db, ms.id)


@router.post("/{manuscript_id}/submit", response_model=ManuscriptOut)
def submit_manuscript(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    _assert_owner_or_editor(ms, current_user)
    if ms.status != ManuscriptStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only DRAFT manuscripts can be submitted")
    if not any(f.file_type == "main" for f in ms.files):
        raise HTTPException(status_code=400, detail="A main manuscript file is required")

    ms.submitted_at = datetime.now(timezone.utc)
    record_status_change(db, ms, ManuscriptStatus.SUBMITTED, current_user.id)
    from app.utils.email import send_submission_confirmation, send_email
    send_submission_confirmation(
        email=current_user.email,
        name=current_user.name,
        manuscript_id=ms.manuscript_id,
        title=ms.title,
        db=db,
    )
    eics = db.query(User).filter(
        User.role == UserRole.EDITOR_IN_CHIEF, User.is_active == True
    ).all()
    for eic in eics:
        if eic.wants_notification("notify_on_submission"):
            send_email(
                to_email=eic.email,
                subject=f"JCAS — New Manuscript Submitted: {ms.manuscript_id}",
                html_body=f"""
                <p>Dear {eic.name},</p>
                <p>A new manuscript, "{ms.title}" (ID: {ms.manuscript_id}), has been submitted
                by {current_user.name} and is awaiting editorial screening.</p>
                <p>Log in to your submission queue to review it.</p>
                <p>Best regards,<br>The JCAS System</p>
                """,
            )
    db.commit()
    return _get_manuscript_or_404(db, ms.id)


@router.post("/{manuscript_id}/resubmit", response_model=ManuscriptOut)
def resubmit_revision(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    _assert_owner_or_editor(ms, current_user)
    if ms.status != ManuscriptStatus.REVISION_REQUIRED:
        raise HTTPException(status_code=400, detail="Manuscript is not pending revision")

    ms.revision_number += 1
    ms.submitted_at = datetime.now(timezone.utc)
    record_status_change(db, ms, ManuscriptStatus.REVISION_SUBMITTED, current_user.id)
    db.commit()

    # Let the assigned editor (or, if none, the whole editor-in-chief pool) and
    # every reviewer who worked on this manuscript know a revision has landed —
    # otherwise the resubmission just sits invisibly until someone happens to look.
    from app.models.review import ReviewAssignment, ReviewStatus

    if ms.editor_id:
        notify_user(
            db, ms.editor_id, "manuscript_resubmitted",
            "Revised Manuscript Submitted",
            f"'{ms.title[:60]}' has been resubmitted with revisions (round {ms.revision_number}).",
        )
    else:
        for eic in db.query(User).filter(User.role == UserRole.EDITOR_IN_CHIEF, User.is_active.is_(True)).all():
            notify_user(
                db, eic.id, "manuscript_resubmitted",
                "Revised Manuscript Submitted",
                f"'{ms.title[:60]}' has been resubmitted with revisions (round {ms.revision_number}).",
            )

    reviewer_ids = {
        a.reviewer_id for a in db.query(ReviewAssignment).filter(
            ReviewAssignment.manuscript_id == ms.id,
            ReviewAssignment.status.notin_([ReviewStatus.DECLINED]),
        ).all()
    }
    for rid in reviewer_ids:
        notify_user(
            db, rid, "manuscript_resubmitted",
            "Revised Manuscript Available",
            f"The author has submitted a revised version of '{ms.title[:60]}', including a response to reviewers if provided. Please take another look.",
        )

    db.commit()
    return _get_manuscript_or_404(db, ms.id)

@router.post("/{manuscript_id}/screen", response_model=ManuscriptOut)
def screen_manuscript(
    manuscript_id: int,
    payload: dict,   # {"decision": "accept"|"decline", "reason": "..."}
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    """EiC initial screening: accept proceeds to editorial workflow,
    decline sends a desk-rejection email and closes the submission."""
    ms = _get_manuscript_or_404(db, manuscript_id)
    if ms.status != ManuscriptStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only SUBMITTED manuscripts can be screened")
    if ms.screened_at:
        raise HTTPException(status_code=400, detail="Manuscript has already been screened")

    decision = payload.get("decision")
    reason   = payload.get("reason", "")

    if decision not in ("accept", "decline"):
        raise HTTPException(status_code=400, detail="Decision must be 'accept' or 'decline'")

    ms.screened_at = datetime.now(timezone.utc)
    ms.screened_by = current_user.id

    if decision == "decline":
        record_status_change(db, ms, ManuscriptStatus.DESK_REJECTED, current_user.id, reason)
        notify_user(db, ms.submitter_id, "desk_rejected",
                    "Update on Your Manuscript Submission",
                    reason or "Your submission did not meet our scope requirements at this time.")
        from app.utils.email import send_screening_declined_email
        send_screening_declined_email(
            author_email=ms.submitter.email,
            author_name=ms.submitter.name,
            manuscript_id=ms.manuscript_id,
            title=ms.title,
            reason=reason,
            db=db,
        )
    else:
        # Accept — record in history, keep status as SUBMITTED so EiC can assign
        record_status_change(db, ms, ManuscriptStatus.SUBMITTED, current_user.id,
                             "Manuscript passed initial screening.")

    db.commit()
    return _get_manuscript_or_404(db, ms.id)


@router.delete("/{manuscript_id}", status_code=204)
def withdraw_manuscript(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    if ms.submitter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    if ms.status in (ManuscriptStatus.PUBLISHED, ManuscriptStatus.ACCEPTED):
        raise HTTPException(status_code=400, detail="Cannot withdraw an accepted or published manuscript")
    record_status_change(db, ms, ManuscriptStatus.WITHDRAWN, current_user.id)
    db.commit()


# ── File uploads ──────────────────────────────────────────────────────────

@router.post("/{manuscript_id}/files", status_code=201)
async def upload_file(
    manuscript_id: int,
    # FIX: expanded to include highlights and title_page
    file_type: str = Query("main", pattern="^(main|supplementary|revision|cover_letter|highlights|title_page)$"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    _assert_owner_or_editor(ms, current_user)

    stored_name, file_path, file_size = await save_upload(file, subfolder=str(ms.id))
    db_file = ManuscriptFile(
        manuscript_id=ms.id,
        file_type=file_type,
        filename=file.filename,
        stored_name=stored_name,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"id": db_file.id, "filename": db_file.filename, "file_size": db_file.file_size}


@router.delete("/{manuscript_id}/files/{file_id}", status_code=204)
def delete_file(
    manuscript_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    _assert_owner_or_editor(ms, current_user)
    f = db.query(ManuscriptFile).filter(
        ManuscriptFile.id == file_id,
        ManuscriptFile.manuscript_id == ms.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(f)
    db.commit()


@router.get("/{manuscript_id}/files/{file_id}/download")
def download_file(
    manuscript_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ms = _get_manuscript_or_404(db, manuscript_id)

    if current_user.role == UserRole.REVIEWER:
        from app.models.review import ReviewAssignment, ReviewStatus
        assignment = db.query(ReviewAssignment).filter(
            ReviewAssignment.manuscript_id == ms.id,
            ReviewAssignment.reviewer_id == current_user.id,
            ReviewAssignment.status.notin_([ReviewStatus.DECLINED]),
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        _assert_owner_or_editor(ms, current_user)

    f = db.query(ManuscriptFile).filter(
        ManuscriptFile.id == file_id,
        ManuscriptFile.manuscript_id == ms.id,
    ).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(f.file_path):
        raise HTTPException(status_code=404, detail="File no longer exists on disk")

    return FileResponse(
        path=f.file_path,
        filename=f.filename,
        media_type=f.mime_type or "application/octet-stream",
    )


# ── Editor endpoints ──────────────────────────────────────────────────────

@router.get("/", response_model=List[ManuscriptSummary])
@router.get("/", response_model=List[ManuscriptSummary])
def list_all_manuscripts(
    status: Optional[ManuscriptStatus] = None,
    skip: int = 0,
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    q = db.query(Manuscript).filter(Manuscript.status != ManuscriptStatus.DRAFT)
    if current_user.role == UserRole.EDITOR:
        # Regular editors only see manuscripts explicitly assigned to them.
        # New/unassigned submissions stay hidden until the Editor-in-Chief
        # screens and assigns them.
        q = q.filter(Manuscript.editor_id == current_user.id)
    if status:
        q = q.filter(Manuscript.status == status)
    return q.order_by(Manuscript.submitted_at.desc()).offset(skip).limit(limit).all()


@router.post("/{manuscript_id}/assign-editor", response_model=ManuscriptOut)
def assign_editor(
    manuscript_id: int,
    payload: EditorAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    editor = db.query(User).filter(
        User.id == payload.editor_id,
        User.role.in_([UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF]),
    ).first()
    if not editor:
        raise HTTPException(status_code=404, detail="Editor not found")
    ms.editor_id = editor.id
    record_status_change(db, ms, ManuscriptStatus.EDITOR_ASSIGNED, current_user.id)
    notify_user(db, ms.submitter_id, "editor_assigned",
                "Editor Assigned to Your Manuscript",
                f"An editor has been assigned to '{ms.title[:60]}'.")
    db.commit()
    return _get_manuscript_or_404(db, ms.id)


@router.post("/{manuscript_id}/send-to-review", response_model=ManuscriptOut)
def send_to_review(
    manuscript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    ms = _get_manuscript_or_404(db, manuscript_id)
    if ms.status not in (ManuscriptStatus.EDITOR_ASSIGNED, ManuscriptStatus.REVISION_SUBMITTED):
        raise HTTPException(status_code=400, detail="Manuscript is not in a reviewable state")
    record_status_change(db, ms, ManuscriptStatus.UNDER_REVIEW, current_user.id)
    notify_user(db, ms.submitter_id, "under_review",
                "Your Manuscript is Under Review",
                f"'{ms.title[:60]}' has been sent to peer reviewers.")
    db.commit()
    return _get_manuscript_or_404(db, ms.id)


@router.post("/{manuscript_id}/decision", response_model=ManuscriptOut)
def editorial_decision(
    manuscript_id: int,
    payload: EditorDecision,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    allowed = {
        ManuscriptStatus.ACCEPTED,
        ManuscriptStatus.REJECTED,
        ManuscriptStatus.REVISION_REQUIRED,
    }
    if payload.decision not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid decision. Choose from: {[s.value for s in allowed]}")

    ms = _get_manuscript_or_404(db, manuscript_id)
    if ms.status not in (ManuscriptStatus.UNDER_REVIEW, ManuscriptStatus.REVISION_SUBMITTED):
        raise HTTPException(status_code=400, detail="Decision can only be made on manuscripts under review")

    record_status_change(db, ms, payload.decision, current_user.id, payload.note)

    notification_map = {
        ManuscriptStatus.ACCEPTED:          ("manuscript_accepted", "Manuscript Accepted 🎉"),
        ManuscriptStatus.REJECTED:          ("manuscript_rejected", "Manuscript Decision: Rejected"),
        ManuscriptStatus.REVISION_REQUIRED: ("revision_required",   "Revision Requested"),
    }
    n_type, n_title = notification_map[payload.decision]
    notify_user(db, ms.submitter_id, n_type, n_title,
                payload.note or f"An editorial decision has been made on '{ms.title[:60]}'.")
    from app.utils.email import send_decision_email
    send_decision_email(
        author_email=ms.submitter.email,
        author_name=ms.submitter.name,
        manuscript_id=ms.manuscript_id,
        decision=payload.decision,
        note=payload.note,
        db=db,
    )

    # Auto-create payment record when manuscript is accepted
    if payload.decision == ManuscriptStatus.ACCEPTED:
        existing_payment = db.query(Payment).filter(Payment.manuscript_id == ms.id).first()
        if not existing_payment:
            from app.routers.journal_settings import get_settings
            try:
                settings_obj = db.query(__import__(
                    'app.models.journal_settings', fromlist=['JournalSettings']
                ).JournalSettings).first()
                apc = settings_obj.apc_amount if settings_obj else 0
                currency = settings_obj.apc_currency if settings_obj else "USD"
            except Exception:
                apc, currency = 0, "USD"
            payment = Payment(manuscript_id=ms.id, amount=apc, currency=currency, status="pending")
            db.add(payment)
            notify_user(db, ms.submitter_id, "payment_required",
                        "Payment Required for Accepted Manuscript",
                        f"Your manuscript '{ms.title[:60]}' has been accepted. Please complete the APC payment to proceed to publication.")

    db.commit()
    return _get_manuscript_or_404(db, ms.id)


@router.post("/{manuscript_id}/revision-reminder", status_code=200)
def send_revision_reminder(
    manuscript_id: int,
    payload: dict = {},
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)),
):
    """Editor/EiC: manually nudge an author whose manuscript is awaiting a revision upload."""
    ms = _get_manuscript_or_404(db, manuscript_id)
    if ms.status != ManuscriptStatus.REVISION_REQUIRED:
        raise HTTPException(status_code=400, detail="Manuscript is not currently awaiting revision")

    deadline = (payload or {}).get("deadline") or "as soon as possible"

    notify_user(db, ms.submitter_id, "revision_reminder",
                "Reminder: Revision Pending",
                f"Reminder: your revised manuscript '{ms.title[:60]}' is still pending upload.")
    from app.utils.email import send_revision_reminder_email
    send_revision_reminder_email(
        author_email=ms.submitter.email,
        author_name=ms.submitter.name,
        manuscript_id=ms.manuscript_id,
        title=ms.title,
        deadline=deadline,
        db=db,
    )
    return {"message": "Revision reminder sent."}

@router.post("/{manuscript_id}/publish", response_model=ManuscriptOut)
def publish_manuscript(
    manuscript_id: int,
    payload: PublishPayload = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    from app.models.payment import Payment
    from app.models.article import Article, AccessType

    ms = _get_manuscript_or_404(db, manuscript_id)
    if ms.status != ManuscriptStatus.ACCEPTED:
        raise HTTPException(status_code=400, detail="Only ACCEPTED manuscripts can be published")

    payment = db.query(Payment).filter(
        Payment.manuscript_id == ms.id, Payment.payment_type == "publication"
    ).first()
    if payment and payment.status != "confirmed":
        raise HTTPException(status_code=400, detail="Publication fee payment must be confirmed before publishing")

    existing = db.query(Article).filter(Article.manuscript_id == ms.id).first()
    if not existing:
        data = payload or PublishPayload()
        article = Article(
            manuscript_id=ms.id,
            issue_id=data.issue_id,
            doi=data.doi,
            page_start=data.page_start,
            page_end=data.page_end,
            access_type=AccessType.OPEN,
            published_at=datetime.now(timezone.utc),
        )
        db.add(article)

    record_status_change(db, ms, ManuscriptStatus.PUBLISHED, current_user.id)
    notify_user(db, ms.submitter_id, "published",
                "Your Manuscript Has Been Published 🎉",
                f"'{ms.title[:60]}' is now published in JCAS.")
    db.commit()
    return _get_manuscript_or_404(db, ms.id)