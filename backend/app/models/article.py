from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Enum as SAEnum, Boolean, Float
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.manuscript import AccessType


class Volume(Base):
    __tablename__ = "volumes"

    id            = Column(Integer, primary_key=True, index=True)
    volume_number = Column(Integer, unique=True, nullable=False, index=True)
    year          = Column(Integer, nullable=False)
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    issues = relationship("Issue", back_populates="volume",
                          cascade="all, delete-orphan",
                          order_by="Issue.issue_number")

    def __repr__(self) -> str:
        return f"<Volume {self.volume_number} ({self.year})>"


class Issue(Base):
    __tablename__ = "issues"

    id           = Column(Integer, primary_key=True, index=True)
    volume_id    = Column(Integer, ForeignKey("volumes.id"), nullable=False)
    issue_number = Column(Integer, nullable=False)
    period       = Column(String(100), nullable=True)     # "January – March 2024"
    published_at = Column(DateTime(timezone=True), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)

    volume   = relationship("Volume", back_populates="issues")
    articles = relationship("Article", back_populates="issue",
                            cascade="all, delete-orphan",
                            order_by="Article.page_start")

    def __repr__(self) -> str:
        return f"<Issue vol={self.volume_id} issue={self.issue_number}>"


class Article(Base):
    """A published, citable version of an accepted manuscript."""
    __tablename__ = "articles"

    id              = Column(Integer, primary_key=True, index=True)
    manuscript_id   = Column(Integer, ForeignKey("manuscripts.id"),
                             unique=True, nullable=False)
    issue_id        = Column(Integer, ForeignKey("issues.id"), nullable=True)

    doi             = Column(String(200), unique=True, nullable=True, index=True)
    page_start      = Column(Integer, nullable=True)
    page_end        = Column(Integer, nullable=True)
    access_type = Column(SAEnum(AccessType, values_callable=lambda x: [e.value for e in x]), default=AccessType.OPEN, nullable=False)
    published_at    = Column(DateTime(timezone=True), nullable=True)

    # Metrics (updated periodically)
    download_count  = Column(Integer, default=0, nullable=False)
    citation_count  = Column(Integer, default=0, nullable=False)
    view_count      = Column(Integer, default=0, nullable=False)

    created_at      = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # ── Relationships ─────────────────────────────────────────────────────
    manuscript = relationship("Manuscript", back_populates="article")
    issue      = relationship("Issue", back_populates="articles")

    @property
    def pages(self) -> str | None:
        if self.page_start and self.page_end:
            return f"{self.page_start}–{self.page_end}"
        return None

    def __repr__(self) -> str:
        return f"<Article doi={self.doi}>"


class Notification(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    type       = Column(String(100), nullable=False)      # e.g. "revision_requested"
    title      = Column(String(500), nullable=False)
    body       = Column(Text, nullable=True)
    is_read    = Column(Boolean, default=False, nullable=False)
    link       = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")
