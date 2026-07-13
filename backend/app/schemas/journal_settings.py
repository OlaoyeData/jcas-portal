from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class JournalSettingsOut(BaseModel):
    id:                 int
    name:               str
    issn_online:        Optional[str]
    issn_print:         Optional[str]
    description:        Optional[str]
    review_model:       str
    submissions_open:   bool
    allowed_file_types: str
    max_upload_mb:      int
    updated_at:         Optional[datetime]

    model_config = {"from_attributes": True}
    


class JournalSettingsUpdate(BaseModel):
    name:               Optional[str]  = None
    issn_online:        Optional[str]  = None
    issn_print:         Optional[str]  = None
    description:        Optional[str]  = None
    review_model:       Optional[str]  = None
    submissions_open:   Optional[bool] = None
    allowed_file_types: Optional[str]  = None
    max_upload_mb:      Optional[int]  = None