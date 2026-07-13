from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EmailTemplateOut(BaseModel):
    id:         int
    key:        str
    label:      str
    subject:    str
    body:       str
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmailTemplateUpdate(BaseModel):
    subject: Optional[str] = None
    body:    Optional[str] = None