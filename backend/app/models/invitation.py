from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class EditorInvitation(Base):
    __tablename__ = "editor_invitations"

    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String(255), nullable=False, index=True)
    name         = Column(String(255), nullable=False)
    role         = Column(String(50),  nullable=False, default="editor")
    token        = Column(String(255), nullable=False, unique=True, index=True)
    invited_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_used      = Column(Boolean, default=False, nullable=False)
    created_at   = Column(DateTime(timezone=True),
                          default=lambda: datetime.now(timezone.utc))
    expires_at   = Column(DateTime(timezone=True), nullable=False)
    accepted_at  = Column(DateTime(timezone=True), nullable=True)

    inviter = relationship("User", foreign_keys=[invited_by])