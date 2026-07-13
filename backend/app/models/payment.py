from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (UniqueConstraint('manuscript_id', 'payment_type', name='uq_payment_manuscript_type'),)

    id                = Column(Integer, primary_key=True, index=True)
    manuscript_id     = Column(Integer, ForeignKey("manuscripts.id"), nullable=False)
    # 'assessment' (payable on submission) or 'publication' (payable on acceptance)
    payment_type      = Column(String(20), nullable=False, default="publication")
    amount            = Column(Float, nullable=False, default=0)
    currency          = Column(String(10), default="USD")
    # pending | submitted | confirmed | waived
    status            = Column(String(30), nullable=False, default="pending")

    proof_filename    = Column(String(500), nullable=True)
    proof_stored_name = Column(String(500), nullable=True)
    proof_file_path   = Column(String(1000), nullable=True)
    proof_mime_type   = Column(String(100), nullable=True)
    proof_uploaded_at = Column(DateTime(timezone=True), nullable=True)

    confirmed_by      = Column(Integer, ForeignKey("users.id"), nullable=True)
    confirmed_at      = Column(DateTime(timezone=True), nullable=True)
    notes             = Column(Text, nullable=True)
    created_at        = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    manuscript = relationship("Manuscript", back_populates="payments")
    confirmer  = relationship("User", foreign_keys=[confirmed_by])