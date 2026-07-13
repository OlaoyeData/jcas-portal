import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Enum as SAEnum, Text, JSON
)
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole(str, enum.Enum):
    AUTHOR          = "author"
    REVIEWER        = "reviewer"
    EDITOR          = "editor"
    EDITOR_IN_CHIEF = "editor_in_chief"
    ADMIN           = "admin"


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name            = Column(String(255), nullable=False)
    role            = Column(SAEnum(UserRole, values_callable=lambda x: [e.value for e in x]),
                             nullable=False, default=UserRole.AUTHOR)
    affiliation     = Column(String(500), nullable=True)
    orcid           = Column(String(50),  nullable=True)
    bio             = Column(Text,        nullable=True)
    expertise_areas = Column(Text,        nullable=True)
    is_active       = Column(Boolean, default=True,  nullable=False)
    is_verified     = Column(Boolean, default=False, nullable=False)
    is_approved     = Column(Boolean, default=True,  nullable=False)  # False for new reviewers
    created_at      = Column(DateTime(timezone=True),
                             default=lambda: datetime.now(timezone.utc))
    updated_at      = Column(DateTime(timezone=True),
                             default=lambda: datetime.now(timezone.utc),
                             onupdate=lambda: datetime.now(timezone.utc))
    last_login      = Column(DateTime(timezone=True), nullable=True)
    notification_preferences = Column(JSON, nullable=False, default=lambda: {
        "notify_on_submission":      True,
        "notify_on_review_complete": True,
        "notify_on_overdue":         True,
        "notify_on_invitation":      True,
    })

    submissions        = relationship("Manuscript", back_populates="submitter",
                                      foreign_keys="Manuscript.submitter_id")
    review_assignments = relationship("ReviewAssignment", back_populates="reviewer",
                                      foreign_keys="ReviewAssignment.reviewer_id")
    notifications      = relationship("Notification", back_populates="user")
    editor_assignments = relationship("Manuscript", back_populates="editor",
                                      foreign_keys="Manuscript.editor_id")

    def wants_notification(self, key: str) -> bool:
        """Defaults to True if unset (opt-out model) so existing users keep getting emails
        until they explicitly turn a preference off."""
        prefs = self.notification_preferences or {}
        return prefs.get(key, True)

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"