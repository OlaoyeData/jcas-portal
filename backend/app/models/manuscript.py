import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Enum as SAEnum, Boolean, JSON
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class ManuscriptStatus(str, enum.Enum):
    DRAFT             = "draft"
    SUBMITTED         = "submitted"
    DESK_REJECTED     = "desk_rejected"       
    EDITOR_ASSIGNED   = "editor_assigned"
    UNDER_REVIEW      = "under_review"
    REVISION_REQUIRED = "revision_required"
    REVISION_SUBMITTED= "revision_submitted"
    ACCEPTED          = "accepted"
    AWAITING_PAYMENT  = "awaiting_payment"    
    REJECTED          = "rejected"
    PUBLISHED         = "published"
    WITHDRAWN         = "withdrawn"


class ArticleType(str, enum.Enum):
    RESEARCH      = "Research Article"
    REVIEW        = "Review Paper"
    SHORT_COMM    = "Short Communication"
    TECHNICAL     = "Technical Note"
    LETTER        = "Letter to the Editor"


class AccessType(str, enum.Enum):
    OPEN         = "open"
    SUBSCRIPTION = "subscription"


class Manuscript(Base):
    __tablename__ = "manuscripts"

    id              = Column(Integer, primary_key=True, index=True)
    manuscript_id   = Column(String(30), unique=True, index=True, nullable=False)
    title           = Column(String(1000), nullable=False)
    article_type = Column(SAEnum(ArticleType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    abstract        = Column(Text, nullable=False)
    keywords        = Column(String(1000), nullable=False)  
    subject_area    = Column(String(200), nullable=True)
    status = Column(SAEnum(ManuscriptStatus, values_callable=lambda x: [e.value for e in x]), default=ManuscriptStatus.DRAFT, nullable=False, index=True)
    cover_letter    = Column(Text, nullable=True)
    revision_number = Column(Integer, default=0, nullable=False)

    # ── Ownership ────────────────────────────────────────────────────────
    submitter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    editor_id    = Column(Integer, ForeignKey("users.id"), nullable=True)

    # ── Policy acknowledgements ──────────────────────────────────────────
    policy_data  = Column(JSON, nullable=True)  # stores checklist state

    # ── Timestamps ───────────────────────────────────────────────────────
    created_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                          onupdate=lambda: datetime.now(timezone.utc))
    decision_at  = Column(DateTime(timezone=True), nullable=True)
    screened_at  = Column(DateTime(timezone=True), nullable=True)
    screened_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    # ── Relationships ─────────────────────────────────────────────────────
    submitter          = relationship("User", back_populates="submissions",
                                      foreign_keys=[submitter_id])
    editor             = relationship("User", back_populates="editor_assignments",
                                      foreign_keys=[editor_id])
    co_authors         = relationship("ManuscriptAuthor", back_populates="manuscript",
                                      cascade="all, delete-orphan",
                                      order_by="ManuscriptAuthor.author_order")
    files              = relationship("ManuscriptFile", back_populates="manuscript",
                                      cascade="all, delete-orphan")
    review_assignments = relationship("ReviewAssignment", back_populates="manuscript",
                                      cascade="all, delete-orphan")
    article            = relationship("Article", back_populates="manuscript",
                                      uselist=False)
    payments           = relationship("Payment", back_populates="manuscript")
    status_history     = relationship("ManuscriptStatusHistory", back_populates="manuscript",
                                      cascade="all, delete-orphan",
                                      order_by="ManuscriptStatusHistory.changed_at")

    def __repr__(self) -> str:
        return f"<Manuscript {self.manuscript_id}: {self.title[:40]}>"


class ManuscriptAuthor(Base):
    __tablename__ = "manuscript_authors"

    id              = Column(Integer, primary_key=True, index=True)
    manuscript_id   = Column(Integer, ForeignKey("manuscripts.id"), nullable=False)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True)
    name            = Column(String(255), nullable=False)
    email           = Column(String(255), nullable=False)
    affiliation     = Column(String(500), nullable=True)
    orcid           = Column(String(50), nullable=True)
    is_corresponding= Column(Boolean, default=False, nullable=False)
    author_order    = Column(Integer, default=0, nullable=False)

    # ── Relationships ─────────────────────────────────────────────────────
    manuscript = relationship("Manuscript", back_populates="co_authors")


class ManuscriptFile(Base):
    __tablename__ = "manuscript_files"

    id            = Column(Integer, primary_key=True, index=True)
    manuscript_id = Column(Integer, ForeignKey("manuscripts.id"), nullable=False)
    file_type     = Column(String(50), nullable=False)   # "main" | "supplementary" | "revision" | "cover_letter"
    filename      = Column(String(500), nullable=False)
    stored_name   = Column(String(500), nullable=False)  # UUID-based stored filename
    file_path     = Column(String(1000), nullable=False)
    file_size     = Column(Integer, nullable=True)       # bytes
    mime_type     = Column(String(100), nullable=True)
    uploaded_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    manuscript = relationship("Manuscript", back_populates="files")


class ManuscriptStatusHistory(Base):
    __tablename__ = "manuscript_status_history"

    id            = Column(Integer, primary_key=True, index=True)
    manuscript_id = Column(Integer, ForeignKey("manuscripts.id"), nullable=False)
    from_status = Column(SAEnum(ManuscriptStatus, values_callable=lambda x: [e.value for e in x]), nullable=True)
    to_status   = Column(SAEnum(ManuscriptStatus, values_callable=lambda x: [e.value for e in x]), nullable=False)
    changed_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    note          = Column(Text, nullable=True)
    changed_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    manuscript = relationship("Manuscript", back_populates="status_history")
