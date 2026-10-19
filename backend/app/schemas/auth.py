from pydantic import BaseModel, EmailStr
from typing import Optional
from app.schemas.user import UserOut



class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterResponse(UserOut):
    """Same fields as UserOut, plus tokens so the new user is logged in straight away.
    Tokens are omitted for accounts that need approval first (new reviewers)."""
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str
