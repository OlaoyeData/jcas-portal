import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Enum as SAEnum, JSON, Boolean
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class ReviewStatus(str, enum.Enum):
    INVITED    = "invited"
    ACCEPTED   = "accepted"
    DECLINED   = "declined"
    IN_PROGRESS= "in_progress"
    SUBMITTED  = "submitted"
    OVERDUE    = "overdue"


class ReviewRecommendation(str, enum.Enum):
    ACCEPT         = "accept"
    MINOR_REVISION = "minor_revision"
    MAJOR_REVISION = "major_revision"
    REJECT         = "reject"


class ReviewAssignment(Base):
    __tablename__ = "review_assignments"

    id            = Column(Integer, primary_key=True, index=True)
    manuscript_id = Column(Integer, ForeignKey("manuscripts.id"), nullable=False)
    reviewer_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SAEnum(ReviewStatus, values_callable=lambda x: [e.value for e in x]), default=ReviewStatus.INVITED, nullable=False, index=True)
    deadline      = Column(DateTime(timezone=True), nullable=True)
    assigned_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    responded_at  = Column(DateTime(timezone=True), nullable=True)
    completed_at  = Column(DateTime(timezone=True), nullable=True)
    decline_reason= Column(Text, nullable=True)
    round_number  = Column(Integer, default=1, nullable=False)   # revision round

    # ── Relationships ─────────────────────────────────────────────────────
    manuscript = relationship("Manuscript", back_populates="review_assignments")
    reviewer   = relationship("User", back_populates="review_assignments",
                              foreign_keys=[reviewer_id])
    review     = relationship("Review", back_populates="assignment", uselist=False,
                              cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ReviewAssignment manuscript={self.manuscript_id} reviewer={self.reviewer_id}>"


class Review(Base):
    __tablename__ = "reviews"

    id            = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("review_assignments.id"),
                           unique=True, nullable=False)

    # Evaluation scores  (1=Poor, 2=Fair, 3=Good, 4=Excellent)
    score_originality  = Column(Integer, nullable=True)
    score_technical    = Column(Integer, nullable=True)
    score_clarity      = Column(Integer, nullable=True)
    score_references   = Column(Integer, nullable=True)

    recommendation = Column(SAEnum(ReviewRecommendation, values_callable=lambda x: [e.value for e in x]), nullable=True)
    comments_to_author     = Column(Text, nullable=True)
    comments_to_editor     = Column(Text, nullable=True)
    conflict_declaration   = Column(Text, nullable=True)

    is_draft      = Column(Boolean, default=True, nullable=False)
    submitted_at  = Column(DateTime(timezone=True), nullable=True)
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # ── Relationships ─────────────────────────────────────────────────────
    assignment = relationship("ReviewAssignment", back_populates="review")
    files      = relationship("ReviewFile", back_populates="review",
                              cascade="all, delete-orphan")

    @property
    def overall_score(self) -> float | None:
        scores = [s for s in [
            self.score_originality, self.score_technical,
            self.score_clarity, self.score_references
        ] if s is not None]
        return round(sum(scores) / len(scores), 2) if scores else None

    def __repr__(self) -> str:
        return f"<Review id={self.id} assignment={self.assignment_id}>"
    
    
class ReviewFile(Base):
    __tablename__ = "review_files"

    id          = Column(Integer, primary_key=True, index=True)
    review_id   = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    filename    = Column(String(500), nullable=False)
    stored_name = Column(String(500), nullable=False)
    file_path   = Column(String(1000), nullable=False)
    file_size   = Column(Integer, nullable=True)
    mime_type   = Column(String(100), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    shared_with_author = Column(Boolean, default=False, nullable=False)
    shared_at   = Column(DateTime(timezone=True), nullable=True)

    review = relationship("Review", back_populates="files")
