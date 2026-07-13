from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from app.db.base import Base


class JournalSettings(Base):
    __tablename__ = "journal_settings"

    id                 = Column(Integer, primary_key=True)
    name               = Column(String(255), nullable=False, default="Journal of Computing & Applied Sciences")
    issn_online        = Column(String(20),  nullable=True)
    issn_print         = Column(String(20),  nullable=True)
    description        = Column(Text,        nullable=True)
    review_model       = Column(String(20),  nullable=False, default="double_blind")
    submissions_open   = Column(Boolean,     nullable=False, default=True)
    allowed_file_types = Column(String(100), nullable=False, default="pdf,docx,zip")
    max_upload_mb      = Column(Integer,     nullable=False, default=50)
    updated_at         = Column(DateTime(timezone=True),
                                default=lambda: datetime.now(timezone.utc),
                                onupdate=lambda: datetime.now(timezone.utc))