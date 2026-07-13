from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
import os, uuid, shutil

from app.core.dependencies import get_db, require_admin
from app.models.journal_settings import JournalSettings
from app.models.user import User
from app.schemas.journal_settings import JournalSettingsOut, JournalSettingsUpdate

router = APIRouter(prefix="/journal-settings", tags=["Journal Settings"])

DEFAULT = {
    "name":               "Journal of Computing & Applied Sciences",
    "issn_online":        "2805-3516",
    "issn_print":         "2006-1234",
    "description":        "A peer-reviewed, open-access journal dedicated to publishing high-quality research across all domains of computer science and related applied sciences.",
    "review_model":       "double_blind",
    "submissions_open":   True,
    "allowed_file_types": "pdf,docx,zip",
    "max_upload_mb":      50,
}


def seed_journal_settings(db: Session):
    """Called on startup — creates the singleton row if missing."""
    if not db.query(JournalSettings).first():
        db.add(JournalSettings(**DEFAULT))
        db.commit()


def get_settings(db: Session) -> JournalSettings:
    """Always returns the single settings row, creating it if needed."""
    settings = db.query(JournalSettings).first()
    if not settings:
        settings = JournalSettings(**DEFAULT)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=JournalSettingsOut)
def read_journal_settings(db: Session = Depends(get_db)):
    """Public — returns journal settings (used in frontend for display)."""
    return get_settings(db)


@router.patch("", response_model=JournalSettingsOut)
def update_journal_settings(
    payload:      JournalSettingsUpdate,
    db:           Session = Depends(get_db),
    _:            User    = Depends(require_admin),
):
    settings = get_settings(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    settings.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(settings)
    return settings
    