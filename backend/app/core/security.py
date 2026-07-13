from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings


# ── Password helpers ─────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(
        plain.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain.encode('utf-8'),
            hashed.encode('utf-8')
        )
    except Exception:
        return False


# ── JWT helpers ──────────────────────────────────────────────────────────

def _create_token(subject: Any, token_type: str, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub":  str(subject),
        "type": token_type,
        "exp":  expire,
        "iat":  datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: Any) -> str:
    return _create_token(
        subject,
        "access",
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(subject: Any) -> str:
    return _create_token(
        subject,
        "refresh",
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
    except JWTError:
        return None


def create_password_reset_token(email: str) -> str:
    return _create_token(email, "password_reset", timedelta(hours=1))


def verify_password_reset_token(token: str) -> Optional[str]:
    payload = decode_token(token)
    if payload and payload.get("type") == "password_reset":
        return payload.get("sub")
    return None

def create_email_verification_token(email: str) -> str:
    return _create_token(email, "email_verification", timedelta(hours=48))


def verify_email_verification_token(token: str) -> Optional[str]:
    payload = decode_token(token)
    if payload and payload.get("type") == "email_verification":
        return payload.get("sub")
    return None