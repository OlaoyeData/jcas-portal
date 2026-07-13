from typing import List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_active_user, require_admin
from app.models.announcement import Announcement
from app.models.user import User
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementOut

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("", response_model=List[AnnouncementOut])
def get_active_announcements(db: Session = Depends(get_db)):
    """Public endpoint — returns all active, non-expired announcements."""
    now = datetime.now(timezone.utc)
    return (
        db.query(Announcement)
        .filter(
            Announcement.is_active == True,
            (Announcement.expires_at == None) | (Announcement.expires_at > now),
        )
        .order_by(Announcement.created_at.desc())
        .all()
    )


@router.get("/all", response_model=List[AnnouncementOut])
def get_all_announcements(
    db:  Session = Depends(get_db),
    _:   User    = Depends(require_admin),
):
    """Admin only — returns all announcements including inactive."""
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()


@router.post("", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload:      AnnouncementCreate,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(require_admin),
):
    ann = Announcement(**payload.model_dump(), created_by=current_user.id)
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@router.patch("/{announcement_id}", response_model=AnnouncementOut)
def update_announcement(
    announcement_id: int,
    payload:         AnnouncementUpdate,
    db:              Session = Depends(get_db),
    _:               User    = Depends(require_admin),
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ann, field, value)
    ann.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    announcement_id: int,
    db:              Session = Depends(get_db),
    _:               User    = Depends(require_admin),
):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()