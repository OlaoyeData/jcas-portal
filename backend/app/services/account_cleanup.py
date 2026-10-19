"""Delete accounts whose owners never verified their email within the allowed window."""
import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.article import Notification
from app.models.manuscript import Manuscript
from app.models.review import ReviewAssignment
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)


def _has_activity(db: Session, user: User) -> bool:
    """Never delete an account that already owns manuscripts or review work."""
    return bool(
        db.query(Manuscript.id).filter(
            (Manuscript.submitter_id == user.id) | (Manuscript.editor_id == user.id)
        ).first()
        or db.query(ReviewAssignment.id).filter(ReviewAssignment.reviewer_id == user.id).first()
    )


def delete_unverified_user(db: Session, user: User) -> bool:
    """Delete one expired, unverified account. Returns True if it was deleted."""
    if not user.is_verification_expired or _has_activity(db, user):
        return False
    try:
        db.query(Notification).filter(Notification.user_id == user.id).delete()
        db.delete(user)
        db.commit()
        logger.info("[CLEANUP] Deleted unverified account %s", user.email)
        return True
    except Exception as exc:
        db.rollback()
        logger.error("[CLEANUP ERROR] %s: %s", user.email, exc)
        return False


def purge_expired_unverified(db: Session) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.UNVERIFIED_ACCOUNT_TTL_HOURS)
    candidates = (
        db.query(User)
        .filter(
            User.is_verified == False,  # noqa: E712
            User.role.in_([UserRole.AUTHOR, UserRole.REVIEWER]),
            User.created_at < cutoff,
        )
        .all()
    )
    return sum(1 for u in candidates if delete_unverified_user(db, u))


def _run_once() -> int:
    db = SessionLocal()
    try:
        return purge_expired_unverified(db)
    finally:
        db.close()


async def unverified_cleanup_loop():
    """Runs for the life of the app: once at startup, then every CLEANUP_INTERVAL_MINUTES."""
    while True:
        try:
            removed = await asyncio.to_thread(_run_once)
            if removed:
                print(f"[CLEANUP] Removed {removed} unverified account(s)")
        except Exception as exc:
            print(f"[CLEANUP ERROR] {exc}")
        await asyncio.sleep(settings.CLEANUP_INTERVAL_MINUTES * 60)
