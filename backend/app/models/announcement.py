from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(255), nullable=False)
    message    = Column(Text, nullable=False)
    type       = Column(String(20), nullable=False, default="info")  # info|warning|urgent|success
    is_active  = Column(Boolean, default=True, nullable=False)
    link       = Column(String(500), nullable=True)
    link_text  = Column(String(100), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    author = relationship("User", foreign_keys=[created_by])