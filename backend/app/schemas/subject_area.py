from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubjectAreaCreate(BaseModel):
    name: str
    slug: str


class SubjectAreaUpdate(BaseModel):
    name:      Optional[str]  = None
    slug:      Optional[str]  = None
    is_active: Optional[bool] = None


class SubjectAreaOut(BaseModel):
    id:         int
    name:       str
    slug:       str
    is_active:  bool
    created_at: datetime

    model_config = {"from_attributes": True}