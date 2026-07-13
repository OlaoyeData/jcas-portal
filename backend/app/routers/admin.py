from typing import List, Optional
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.core.dependencies import get_db, require_admin
from app.models.user       import User, UserRole
from app.models.manuscript import Manuscript, ManuscriptStatus
from app.models.review     import ReviewAssignment, ReviewStatus
from app.models.article    import Article, Volume, Issue
from app.models.invitation import EditorInvitation

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Stats ─────────────────────────────────────────────────────────────────

@router.get("/stats/overview")
def get_overview_stats(
    db: Session = Depends(get_db),
    _: User     = Depends(require_admin),
):
    total_users        = db.query(func.count(User.id)).scalar()
    active_users       = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar()
    total_manuscripts  = db.query(func.count(Manuscript.id)).scalar()
    published_articles = db.query(func.count(Article.id)).scalar()
    pending_reviews    = db.query(func.count(ReviewAssignment.id)).filter(
        ReviewAssignment.status.in_([
            ReviewStatus.INVITED, ReviewStatus.ACCEPTED, ReviewStatus.IN_PROGRESS
        ])
    ).scalar()
    overdue_reviews = db.query(func.count(ReviewAssignment.id)).filter(
        ReviewAssignment.status == ReviewStatus.OVERDUE
    ).scalar()
    status_counts = dict(
        db.query(Manuscript.status, func.count(Manuscript.id))
        .group_by(Manuscript.status).all()
    )
    role_counts = dict(
        db.query(User.role, func.count(User.id))
        .group_by(User.role).all()
    )
    decided  = db.query(func.count(Manuscript.id)).filter(
        Manuscript.status.in_([
            ManuscriptStatus.ACCEPTED, ManuscriptStatus.PUBLISHED, ManuscriptStatus.REJECTED,
        ])
    ).scalar() or 1
    accepted = db.query(func.count(Manuscript.id)).filter(
        Manuscript.status.in_([ManuscriptStatus.ACCEPTED, ManuscriptStatus.PUBLISHED])
    ).scalar()

    return {
        "users":           {"total": total_users, "active": active_users,
                            "by_role": {r.value: c for r, c in role_counts.items()}},
        "manuscripts":     {"total": total_manuscripts,
                            "by_status": {s.value: c for s, c in status_counts.items()}},
        "articles":        {"published": published_articles},
        "reviews":         {"pending": pending_reviews, "overdue": overdue_reviews},
        "acceptance_rate": round((accepted / decided) * 100, 1),
    }


@router.get("/stats/submissions-by-month")
def get_submissions_by_month(
    months: int = 12,
    db: Session = Depends(get_db),
    _: User     = Depends(require_admin),
):
    rows = db.execute(
        text("""
            SELECT TO_CHAR(submitted_at, 'YYYY-MM') AS month, COUNT(*) AS submissions
            FROM manuscripts
            WHERE submitted_at >= NOW() - INTERVAL ':months months'
            GROUP BY month ORDER BY month ASC
        """),
        {"months": months},
    ).fetchall()
    return [{"month": r[0], "submissions": r[1]} for r in rows]


@router.get("/stats/review-turnaround")
def get_review_turnaround(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    result = db.execute(
        text("""
            SELECT AVG(EXTRACT(EPOCH FROM (decision_at - submitted_at)) / 86400)::NUMERIC(10,1)
            FROM manuscripts WHERE decision_at IS NOT NULL AND submitted_at IS NOT NULL
        """)
    ).scalar()
    return {"avg_decision_days": float(result) if result else None}


@router.get("/audit-log")
def get_audit_log(
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    from app.models.manuscript import ManuscriptStatusHistory
    rows = (
        db.query(ManuscriptStatusHistory)
        .order_by(ManuscriptStatusHistory.changed_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [
        {
            "manuscript_id": r.manuscript_id,
            "from":  r.from_status.value if r.from_status else None,
            "to":    r.to_status.value,
            "by":    r.changed_by,
            "note":  r.note,
            "at":    r.changed_at,
        }
        for r in rows
    ]


# ── Editor Invitations ────────────────────────────────────────────────────

@router.post("/invite-editor", status_code=201)
def invite_editor(
    payload: dict,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin),
):
    """
    Invite a new editor or editor-in-chief.
    payload: { email, name, role: 'editor' | 'editor_in_chief' }
    """
    email = payload.get("email", "").strip().lower()
    name  = payload.get("name",  "").strip()
    role  = payload.get("role",  "editor")

    if not email or not name:
        raise HTTPException(status_code=400, detail="Email and name are required")
    if role not in ("editor", "editor_in_chief"):
        raise HTTPException(status_code=400, detail="Role must be editor or editor_in_chief")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    # Invalidate any existing unused invitation for this email
    db.query(EditorInvitation).filter(
        EditorInvitation.email == email,
        EditorInvitation.is_used == False,
    ).delete()

    token      = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    inv = EditorInvitation(
        email=email, name=name, role=role,
        token=token, invited_by=current_user.id, expires_at=expires_at,
    )
    db.add(inv)
    db.commit()

    # Send invitation email
    from app.core.config import settings
    from app.utils.email import send_email
    accept_url = f"{settings.FRONTEND_URL}/accept-invitation/{token}"
    send_email(
        to_email=email,
        subject="JCAS — You've been invited to join as an Editor",
        html_body=f"""
        <p>Dear {name},</p>
        <p>You have been invited to join the Journal of Computing & Applied Sciences (JCAS)
        as a <strong>{role.replace('_', ' ').title()}</strong>.</p>
        <p>Click the link below to accept and set up your account
        (link expires in 7 days):</p>
        <p><a href="{accept_url}">{accept_url}</a></p>
        <br><p>Best regards,<br>The JCAS Team</p>
        """,
    )

    return {
        "detail": f"Invitation sent to {email}.",
        "expires_at": expires_at,
    }


@router.get("/invitations")
def list_invitations(
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    invs = db.query(EditorInvitation).order_by(EditorInvitation.created_at.desc()).all()
    return [
        {
            "id":         i.id,
            "email":      i.email,
            "name":       i.name,
            "role":       i.role,
            "is_used":    i.is_used,
            "created_at": i.created_at,
            "expires_at": i.expires_at,
        }
        for i in invs
    ]


@router.delete("/invitations/{inv_id}", status_code=204)
def revoke_invitation(
    inv_id: int,
    db:     Session = Depends(get_db),
    _:      User    = Depends(require_admin),
):
    inv = db.query(EditorInvitation).filter(EditorInvitation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")
    db.delete(inv)
    db.commit()


# ── Reviewer Vetting ──────────────────────────────────────────────────────

@router.get("/reviewers/pending")
def list_pending_reviewers(
    db: Session = Depends(get_db),
    _:  User    = Depends(require_admin),
):
    """List reviewers awaiting approval."""
    reviewers = db.query(User).filter(
        User.role == UserRole.REVIEWER,
        User.is_approved == False,
    ).all()
    return [
        {
            "id":             r.id,
            "name":           r.name,
            "email":          r.email,
            "affiliation":    r.affiliation,
            "expertise_areas":r.expertise_areas,
            "created_at":     r.created_at,
        }
        for r in reviewers
    ]


@router.post("/reviewers/{user_id}/approve", status_code=200)
def approve_reviewer(
    user_id: int,
    db:      Session = Depends(get_db),
    _:       User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.REVIEWER).first()
    if not user:
        raise HTTPException(status_code=404, detail="Reviewer not found")
    user.is_approved = True
    db.commit()
    # Send approval email
    from app.core.config import settings
    from app.utils.email import send_email
    send_email(
        to_email=user.email,
        subject="JCAS — Your reviewer account has been approved",
        html_body=f"""
        <p>Dear {user.name},</p>
        <p>Your reviewer account on JCAS has been approved.
        You can now log in and accept review invitations.</p>
        <p><a href="{settings.FRONTEND_URL}/login">Log in to JCAS</a></p>
        <br><p>Best regards,<br>The JCAS Editorial Team</p>
        """,
    )
    return {"detail": "Reviewer approved."}


@router.post("/reviewers/{user_id}/reject", status_code=200)
def reject_reviewer(
    user_id: int,
    db:      Session = Depends(get_db),
    _:       User    = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.REVIEWER).first()
    if not user:
        raise HTTPException(status_code=404, detail="Reviewer not found")
    user.is_active = False
    db.commit()
    # Notify the rejected applicant
    from app.utils.email import send_email
    send_email(
        to_email=user.email,
        subject="JCAS — Update on Your Reviewer Application",
        html_body=f"""
        <p>Dear {user.name},</p>
        <p>Thank you for your interest in reviewing for the Journal of Computing & Applied Sciences (JCAS).
        After consideration, we are unable to approve your reviewer account at this time.</p>
        <p>Best regards,<br>The JCAS Editorial Team</p>
        """,
    )
    return {"detail": "Reviewer rejected."}