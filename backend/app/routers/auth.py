from datetime import datetime, timezone
import token
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, create_password_reset_token,
    verify_password_reset_token,
)
from app.models.user import User, UserRole
from app.schemas.auth import (
    LoginRequest, TokenResponse, RefreshRequest,
    AccessTokenResponse, PasswordResetRequest, PasswordResetConfirm,
)
from app.schemas.user import UserCreate, UserOut
from app.utils.email import send_welcome_email, send_password_reset_email
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, create_password_reset_token,
    verify_password_reset_token,
    create_email_verification_token, verify_email_verification_token,
)
from app.utils.email import (
    send_welcome_email, send_password_reset_email,
    send_verification_email, notify_admins_of_verification,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def _get_admin_emails(db: Session) -> list:
    admins = db.query(User).filter(
        User.role == UserRole.ADMIN, User.is_active == True
    ).all()
    return [a.email for a in admins]


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # Block privileged roles from self-registering
    if payload.role in (UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF, UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail="Editor and admin accounts must be created by invitation. Please contact the editorial office."
        )
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Set is_approved=False for new reviewers (pending vetting)
    is_approved = payload.role != UserRole.REVIEWER
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        name=payload.name,
        role=payload.role,
        affiliation=payload.affiliation,
        orcid=payload.orcid,
        bio=payload.bio,
        expertise_areas=payload.expertise_areas,
        is_active=True,
        is_verified=False,
        is_approved=is_approved,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_email_verification_token(user.email)
    send_verification_email(name=user.name, email=user.email, token=token, db=db)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return JWT tokens."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    if user.role == UserRole.AUTHOR and not user.is_verified:
        notify_admins_of_verification(
            admin_emails=_get_admin_emails(db),
            user_name=user.name, user_email=user.email,
            confirmed=False, db=db,
        )
        raise HTTPException(
            status_code=403,
            detail="Please confirm your email address before logging in. Check your inbox for the confirmation link."
        )
    if user.role == UserRole.REVIEWER and not user.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Your reviewer account is pending approval by the editorial office."
        )

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a refresh token for a new access token."""
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == int(data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return AccessTokenResponse(access_token=create_access_token(user.id))


def _send_password_reset_email_task(email: str, token: str, name: str):
    """Runs after the response is sent — must open its own DB session since the
    request-scoped session is already closed by the time background tasks execute."""
    from app.db.session import SessionLocal
    db = SessionLocal()
    try:
        send_password_reset_email(email=email, token=token, name=name, db=db)
    finally:
        db.close()


@router.post("/password-reset/request", status_code=202)
def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send a password-reset link (fire-and-forget; always returns 202)."""
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = create_password_reset_token(user.email)
        background_tasks.add_task(
            _send_password_reset_email_task,
            email=user.email,
            token=token,
            name=user.name,
        )
    return {"detail": "If that email is registered, a reset link has been sent."}


@router.post("/password-reset/confirm", status_code=200)
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Apply a new password using the reset token."""
    email = verify_password_reset_token(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password updated successfully"}

@router.post("/verify-email", status_code=200)
def verify_email(payload: dict, db: Session = Depends(get_db)):
    """Confirm a user's email address using the token from their verification email.
    payload: { token }"""
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")

    email = verify_email_verification_token(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"detail": "Email already confirmed. You can log in."}

    user.is_verified = True
    db.commit()
    db.refresh(user)

    send_welcome_email(name=user.name, email=user.email, db=db)
    notify_admins_of_verification(
        admin_emails=_get_admin_emails(db),
        user_name=user.name, user_email=user.email,
        confirmed=True, db=db,
    )
    return {"detail": "Email confirmed successfully. You can now log in."}


@router.post("/verify-email/resend", status_code=202)
def resend_verification_email(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    """Resend the confirmation link (fire-and-forget; always returns 202 to avoid leaking
    which emails are registered). payload: { email }"""
    user = db.query(User).filter(User.email == payload.email).first()
    if user and not user.is_verified:
        token = create_email_verification_token(user.email)
        send_verification_email(name=user.name, email=user.email, token=token, db=db)
    return {"detail": "If that email is registered and unconfirmed, a new link has been sent."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the currently authenticated user's profile."""
    return current_user

@router.get("/invitation/{token}")
def get_invitation(token: str, db: Session = Depends(get_db)):
    """Validate an invitation token and return its details."""
    from app.models.invitation import EditorInvitation
    inv = db.query(EditorInvitation).filter(
        EditorInvitation.token == token,
        EditorInvitation.is_used == False,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")
    if inv.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation has expired")
    return {"email": inv.email, "name": inv.name, "role": inv.role}


@router.post("/accept-invitation", response_model=UserOut, status_code=201)
def accept_invitation(
    payload: dict,
    db: Session = Depends(get_db),
):
    """
    Accept an editor invitation and create the account.
    payload: { token, password }
    """
    from app.models.invitation import EditorInvitation
    token    = payload.get("token")
    password = payload.get("password")

    if not token or not password:
        raise HTTPException(status_code=400, detail="Token and password are required")

    inv = db.query(EditorInvitation).filter(
        EditorInvitation.token == token,
        EditorInvitation.is_used == False,
    ).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invalid or already used invitation")
    if inv.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation has expired")
    if db.query(User).filter(User.email == inv.email).first():
        raise HTTPException(status_code=409, detail="Account already exists for this email")

    user = User(
        email=inv.email,
        hashed_password=hash_password(password),
        name=inv.name,
        role=UserRole(inv.role),
        is_active=True,
        is_verified=True,
        is_approved=True,
    )
    db.add(user)
    inv.is_used     = True
    inv.accepted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    send_welcome_email(name=user.name, email=user.email, db=db)
    return user