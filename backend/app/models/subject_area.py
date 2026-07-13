from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base


class SubjectArea(Base):
    __tablename__ = "subject_areas"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(200), nullable=False)
    slug       = Column(String(200), nullable=False, unique=True)
    is_active  = Column(Boolean,     nullable=False, default=True)
    created_at = Column(DateTime(timezone=True),
                        default=lambda: datetime.now(timezone.utc))