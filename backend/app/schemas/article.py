from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.manuscript import AccessType, ArticleType


class VolumeCreate(BaseModel):
    volume_number: int
    year:          int


class IssueCreate(BaseModel):
    volume_id:    int
    issue_number: int
    period:       Optional[str] = None


class ArticleAuthorOut(BaseModel):
    name:             str
    affiliation:      Optional[str] = None
    is_corresponding: bool = False


class ArticleOut(BaseModel):
    id:             int
    manuscript_id:  int
    issue_id:       Optional[int]      = None
    doi:            Optional[str]      = None
    pages:          Optional[str]      = None
    page_start:     Optional[int]      = None
    page_end:       Optional[int]      = None
    access_type:    AccessType
    published_at:   Optional[datetime] = None
    download_count: int
    citation_count: int
    view_count:     int

    # Embedded manuscript fields
    title:        Optional[str]         = None
    abstract:     Optional[str]         = None
    keywords:     Optional[str]         = None
    article_type: Optional[ArticleType] = None
    authors:      List[ArticleAuthorOut] = []

    # Embedded issue/volume fields
    volume_number: Optional[int] = None
    issue_number:  Optional[int] = None
    year:          Optional[int] = None

    model_config = {"from_attributes": True}


class IssueOut(BaseModel):
    id:           int
    volume_id:    int
    issue_number: int
    period:       Optional[str]      = None
    published_at: Optional[datetime] = None
    is_published: bool
    article_count: int = 0

    model_config = {"from_attributes": True}


class VolumeOut(BaseModel):
    id:            int
    volume_number: int
    year:          int
    issues:        List[IssueOut] = []

    model_config = {"from_attributes": True}


class PublishArticle(BaseModel):
    issue_id:    int
    doi:         str
    page_start:  int
    page_end:    int
    access_type: AccessType = AccessType.OPEN


class NotificationOut(BaseModel):
    id:         int
    type:       str
    title:      str
    body:       Optional[str] = None
    is_read:    bool
    link:       Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}