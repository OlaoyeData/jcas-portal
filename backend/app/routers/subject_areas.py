from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_admin
from app.models.subject_area import SubjectArea
from app.models.user import User
from app.schemas.subject_area import SubjectAreaCreate, SubjectAreaUpdate, SubjectAreaOut

router = APIRouter(prefix="/subject-areas", tags=["Subject Areas"])

DEFAULT_SUBJECTS = [
    {"name": "Artificial Intelligence",    "slug": "artificial-intelligence"},
    {"name": "Machine Learning",           "slug": "machine-learning"},
    {"name": "Computer Networks",          "slug": "computer-networks"},
    {"name": "Distributed Systems",        "slug": "distributed-systems"},
    {"name": "Cybersecurity",              "slug": "cybersecurity"},
    {"name": "Human-Computer Interaction", "slug": "hci"},
    {"name": "Quantum Computing",          "slug": "quantum-computing"},
    {"name": "Database Systems",           "slug": "database-systems"},
    {"name": "Software Engineering",       "slug": "software-engineering"},
    {"name": "Computer Vision",            "slug": "computer-vision"},
]


def seed_subject_areas(db: Session):
    """Called on startup — inserts missing default subjects."""
    if db.query(SubjectArea).count() == 0:
        for s in DEFAULT_SUBJECTS:
            db.add(SubjectArea(**s))
        db.commit()


@router.get("", response_model=List[SubjectAreaOut])
def list_subject_areas(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """Public — returns subject areas (active only by default)."""
    q = db.query(SubjectArea)
    if active_only:
        q = q.filter(SubjectArea.is_active == True)
    return q.order_by(SubjectArea.name).all()


@router.post("", response_model=SubjectAreaOut, status_code=201)
def create_subject_area(
    payload: SubjectAreaCreate,
    db:      Session = Depends(get_db),
    _:       User    = Depends(require_admin),
):
    if db.query(SubjectArea).filter(SubjectArea.slug == payload.slug).first():
        raise HTTPException(status_code=409, detail="Slug already exists")
    subject = SubjectArea(name=payload.name, slug=payload.slug)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.patch("/{subject_id}", response_model=SubjectAreaOut)
def update_subject_area(
    subject_id: int,
    payload:    SubjectAreaUpdate,
    db:         Session = Depends(get_db),
    _:          User    = Depends(require_admin),
):
    subject = db.query(SubjectArea).filter(SubjectArea.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject area not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=204)
def delete_subject_area(
    subject_id: int,
    db:         Session = Depends(get_db),
    _:          User    = Depends(require_admin),
):
    subject = db.query(SubjectArea).filter(SubjectArea.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject area not found")
    db.delete(subject)
    db.commit()