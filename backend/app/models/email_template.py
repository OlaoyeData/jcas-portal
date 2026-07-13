from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.db.base import Base


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id         = Column(Integer, primary_key=True, index=True)
    key        = Column(String(100), unique=True, nullable=False)
    label      = Column(String(200), nullable=False)
    subject    = Column(String(500), nullable=False)
    body       = Column(Text,        nullable=False)
    updated_at = Column(DateTime(timezone=True),
                        default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)