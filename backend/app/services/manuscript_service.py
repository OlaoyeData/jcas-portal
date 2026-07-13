from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.manuscript import Manuscript, ManuscriptStatus, ManuscriptStatusHistory
from app.models.article import Notification


def generate_manuscript_id(db: Session) -> str:
    """Generate JCAS-YYYY-XXXX style unique ID."""
    year = datetime.now(timezone.utc).year
    prefix = f"JCAS-{year}-"
    latest = (
        db.query(Manuscript)
        .filter(Manuscript.manuscript_id.like(f"{prefix}%"))
        .order_by(Manuscript.id.desc())
        .first()
    )
    if latest:
        seq = int(latest.manuscript_id.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def record_status_change(
    db: Session,
    manuscript: Manuscript,
    new_status: ManuscriptStatus,
    changed_by_id: int | None = None,
    note: str | None = None,
) -> None:
    """Write a status transition record."""
    history = ManuscriptStatusHistory(
        manuscript_id=manuscript.id,
        from_status=manuscript.status,
        to_status=new_status,
        changed_by=changed_by_id,
        note=note,
    )
    db.add(history)
    manuscript.status = new_status
    if new_status in (
        ManuscriptStatus.ACCEPTED,
        ManuscriptStatus.REJECTED,
        ManuscriptStatus.REVISION_REQUIRED,
    ):
        manuscript.decision_at = datetime.now(timezone.utc)


def notify_user(
    db: Session,
    user_id: int,
    type_: str,
    title: str,
    body: str | None = None,
    link: str | None = None,
) -> None:
    """Insert an in-app notification."""
    n = Notification(user_id=user_id, type=type_, title=title, body=body, link=link)
    db.add(n)
