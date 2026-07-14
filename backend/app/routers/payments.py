import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_active_user, require_role
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.payment import Payment
from fastapi.responses import FileResponse

router = APIRouter(prefix="/payments", tags=["Payments"])

ASSESSMENT_FEE_NGN = 5000
PUBLICATION_FEE_NGN = 30000
FOREIGN_ASSESSMENT_FEE_USD = 100  # combined assessment + publication for foreign contributors


def _correct_defaults(payment_type: str, db: Session):
    if payment_type == "assessment":
        return ASSESSMENT_FEE_NGN, "NGN"
    try:
        from app.models.journal_settings import JournalSettings
        s   = db.query(JournalSettings).first()
        apc = getattr(s, 'apc_amount', None) or PUBLICATION_FEE_NGN
        cur = getattr(s, 'apc_currency', None) or 'NGN'
    except Exception:
        apc, cur = PUBLICATION_FEE_NGN, 'NGN'
    return apc, cur


def _get_or_create_payment(db: Session, manuscript_id: int, payment_type: str) -> Payment:
    from app.models.manuscript import Manuscript

    ms = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Manuscript not found")

    payment = db.query(Payment).filter(
        Payment.manuscript_id == manuscript_id, Payment.payment_type == payment_type
    ).first()

    if payment:
        # Self-heal legacy/broken rows (amount=0) left over from before
        # assessment/publication fees were tracked separately.
        if not payment.amount or payment.amount <= 0:
            amount, currency = _correct_defaults(payment_type, db)
            payment.amount   = amount
            payment.currency = currency
            db.commit()
            db.refresh(payment)
        return payment

    if payment_type == "assessment":
        if ms.status.value == "draft":
            raise HTTPException(status_code=400, detail="Manuscript has not been submitted yet")
    else:  # publication
        if ms.status.value not in ("accepted", "awaiting_payment"):
            raise HTTPException(status_code=404, detail="No payment record found")

    amount, currency = _correct_defaults(payment_type, db)
    payment = Payment(
        manuscript_id=manuscript_id, payment_type=payment_type,
        amount=amount, currency=currency, status="pending",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/manuscript/{manuscript_id}")
def get_payment(
    manuscript_id: int,
    payment_type: str = Query("publication", pattern="^(assessment|publication)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return _get_or_create_payment(db, manuscript_id, payment_type)


@router.post("/manuscript/{manuscript_id}/upload-proof", status_code=200)
async def upload_payment_proof(
    manuscript_id: int,
    payment_type: str = Query("publication", pattern="^(assessment|publication)$"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Author uploads payment screenshot. Only PNG, JPG, JPEG accepted."""
    allowed_extensions = {".png", ".jpg", ".jpeg"}
    file_ext = os.path.splitext(file.filename or "")[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG, and JPEG image files are accepted as payment proof."
        )

    from app.models.manuscript import Manuscript
    ms = db.query(Manuscript).filter(Manuscript.id == manuscript_id).first()
    if not ms:
        raise HTTPException(status_code=404, detail="Manuscript not found")
    if ms.submitter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    payment = _get_or_create_payment(db, manuscript_id, payment_type)
    if payment.status == "confirmed":
        raise HTTPException(status_code=400, detail="Payment already confirmed")

    contents  = await file.read()
    stored_name = f"{uuid.uuid4().hex}{file_ext}"

    if settings.USE_S3:
        from app.utils.storage import upload_bytes
        file_path = f"payments/{stored_name}"
        upload_bytes(contents, file_path, content_type=file.content_type or "image/jpeg")
    else:
        upload_dir = os.path.join(settings.UPLOAD_DIR, "payments")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, stored_name)
        with open(file_path, "wb") as fp:
            fp.write(contents)

    payment.proof_filename    = file.filename
    payment.proof_stored_name = stored_name
    payment.proof_file_path   = file_path
    payment.proof_mime_type   = file.content_type
    payment.proof_uploaded_at = datetime.now(timezone.utc)
    payment.status            = "submitted"

    db.commit()

    from app.services.manuscript_service import notify_user
    label = "assessment fee" if payment_type == "assessment" else "publication fee"
    for eic in db.query(User).filter(User.role == UserRole.EDITOR_IN_CHIEF, User.is_active.is_(True)).all():
        notify_user(
            db, eic.id, "payment_proof_uploaded",
            f"Payment Proof Uploaded ({label})",
            f"'{ms.title[:60]}' — proof of {label} payment has been submitted and needs confirmation.",
        )
    db.commit()

    return {"message": "Payment proof uploaded successfully. Awaiting confirmation from the editorial office."}


@router.post("/manuscript/{manuscript_id}/confirm")
def confirm_payment(
    manuscript_id: int,
    payment_type: str = Query("publication", pattern="^(assessment|publication)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    """EiC confirms the payment. Confirming the publication fee unlocks the publish button."""
    payment = db.query(Payment).filter(
        Payment.manuscript_id == manuscript_id, Payment.payment_type == payment_type
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment record found")
    if payment.status != "submitted":
        raise HTTPException(status_code=400, detail="No proof has been uploaded yet")

    payment.status       = "confirmed"
    payment.confirmed_by = current_user.id
    payment.confirmed_at = datetime.now(timezone.utc)
    db.commit()

    from app.services.manuscript_service import notify_user
    if payment_type == "assessment":
        notify_user(
            db, payment.manuscript.submitter_id, "payment_confirmed",
            "Assessment Fee Confirmed",
            "Your manuscript assessment fee has been confirmed. Your submission will proceed to editorial screening."
        )
    else:
        notify_user(
            db, payment.manuscript.submitter_id, "payment_confirmed",
            "Payment Confirmed — Ready for Publication",
            "Your publication fee has been confirmed. Your manuscript will be published shortly."
        )

    from app.utils.email import send_payment_confirmed_email
    send_payment_confirmed_email(
        author_email=payment.manuscript.submitter.email,
        author_name=payment.manuscript.submitter.name,
        manuscript_id=payment.manuscript.manuscript_id,
        title=payment.manuscript.title,
        db=db,
    )

    db.commit()
    return {"message": "Payment confirmed"}


@router.get("/pending")
def list_pending_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    """EiC: list all payments (assessment or publication) awaiting confirmation."""
    return db.query(Payment).filter(Payment.status == "submitted").all()


@router.get("/confirmed")
def list_confirmed_payments(
    payment_type: str = Query("publication", pattern="^(assessment|publication)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    """EiC: list manuscript IDs whose payment of a given type is confirmed."""
    payments = db.query(Payment).filter(
        Payment.status == "confirmed", Payment.payment_type == payment_type
    ).all()
    return [{"manuscript_id": p.manuscript_id, "confirmed_at": p.confirmed_at} for p in payments]


@router.get("/manuscript/{manuscript_id}/proof")
def download_payment_proof(
    manuscript_id: int,
    payment_type: str = Query("publication", pattern="^(assessment|publication)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF)),
):
    """EiC downloads/views the payment proof image."""
    payment = db.query(Payment).filter(
        Payment.manuscript_id == manuscript_id, Payment.payment_type == payment_type
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment record found")
    if not payment.proof_file_path:
        raise HTTPException(status_code=404, detail="No proof has been uploaded yet")

    if settings.USE_S3:
        from app.utils.storage import generate_download_url
        from fastapi.responses import RedirectResponse
        return RedirectResponse(generate_download_url(
            payment.proof_file_path, filename=payment.proof_filename or "payment_proof"
        ))

    if not os.path.exists(payment.proof_file_path):
        raise HTTPException(status_code=404, detail="Proof file no longer exists on disk")

    return FileResponse(
        path=payment.proof_file_path,
        filename=payment.proof_filename or "payment_proof",
        media_type=payment.proof_mime_type or "image/png",
    )


@router.get("/my")
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all payment records belonging to the current user's manuscripts."""
    from app.models.manuscript import Manuscript
    ms_ids = [row.id for row in db.query(Manuscript.id).filter(
        Manuscript.submitter_id == current_user.id
    ).all()]
    if not ms_ids:
        return []
    return db.query(Payment).filter(Payment.manuscript_id.in_(ms_ids)).all()