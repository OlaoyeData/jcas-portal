from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.AUTHOR
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    bio: Optional[str] = None
    expertise_areas: Optional[str] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    bio: Optional[str] = None
    expertise_areas: Optional[str] = None
    notification_preferences: Optional[dict] = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserOut(BaseModel):
    id:             int
    email:          str
    name:           str
    role:           str
    affiliation:    Optional[str]
    orcid:          Optional[str]
    bio:            Optional[str]
    expertise_areas:Optional[str]
    is_active:      bool
    is_verified:    bool
    is_approved:    bool          # ← add this
    notification_preferences: dict = {}
    created_at:     datetime
    last_login:     Optional[datetime]

    model_config = {"from_attributes": True}


class UserSummary(BaseModel):
    """Lightweight user info for embeds."""
    id: int
    name: str
    email: str
    affiliation: Optional[str] = None
    role: UserRole

    model_config = {"from_attributes": True}


class UserAdminUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_approved: Optional[bool] = None