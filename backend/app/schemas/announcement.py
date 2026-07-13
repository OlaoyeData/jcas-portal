from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AnnouncementCreate(BaseModel):
    title:     str
    message:   str
    type:      str = "info"
    is_active: bool = True
    link:      Optional[str] = None
    link_text: Optional[str] = None
    expires_at:Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    title:     Optional[str]      = None
    message:   Optional[str]      = None
    type:      Optional[str]      = None
    is_active: Optional[bool]     = None
    link:      Optional[str]      = None
    link_text: Optional[str]      = None
    expires_at:Optional[datetime] = None


class AnnouncementOut(BaseModel):
    id:         int
    title:      str
    message:    str
    type:       str
    is_active:  bool
    link:       Optional[str]
    link_text:  Optional[str]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}