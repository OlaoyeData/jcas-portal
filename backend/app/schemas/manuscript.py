from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.manuscript import ManuscriptStatus, ArticleType


class ManuscriptAuthorSchema(BaseModel):
    name: str
    email: str
    affiliation: Optional[str] = None
    orcid: Optional[str] = None
    is_corresponding: bool = False
    author_order: int = 0

    model_config = {"from_attributes": True}


class ManuscriptFileSchema(BaseModel):
    id: int
    file_type: str
    filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ManuscriptCreate(BaseModel):
    title: str
    article_type: ArticleType
    abstract: str
    keywords: str
    subject_area: Optional[str] = None
    cover_letter: Optional[str] = None
    co_authors: List[ManuscriptAuthorSchema] = []
    policy_data: Optional[dict] = None

    @field_validator("abstract")
    @classmethod
    def abstract_length(cls, v: str) -> str:
        words = len(v.split())
        if words < 50:
            raise ValueError("Abstract must be at least 50 words")
        if words > 350:
            raise ValueError("Abstract must not exceed 350 words")
        return v

    @field_validator("title")
    @classmethod
    def title_length(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Title is too short")
        return v.strip()


class ManuscriptUpdate(BaseModel):
    title: Optional[str] = None
    abstract: Optional[str] = None
    keywords: Optional[str] = None
    subject_area: Optional[str] = None
    cover_letter: Optional[str] = None
    co_authors: Optional[List[ManuscriptAuthorSchema]] = None


class StatusHistoryOut(BaseModel):
    from_status: Optional[ManuscriptStatus] = None
    to_status: ManuscriptStatus
    note: Optional[str] = None
    changed_at: datetime

    model_config = {"from_attributes": True}


class ManuscriptOut(BaseModel):
    id: int
    manuscript_id: str
    title: str
    article_type: ArticleType
    abstract: str
    keywords: str
    subject_area: Optional[str] = None
    status: ManuscriptStatus
    revision_number: int
    submitter_id: int
    editor_id: Optional[int] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None
    updated_at: datetime
    decision_at: Optional[datetime] = None
    co_authors: List[ManuscriptAuthorSchema] = []
    files: List[ManuscriptFileSchema] = []
    status_history: List[StatusHistoryOut] = []

    model_config = {"from_attributes": True}


class ManuscriptSummary(BaseModel):
    """For list views."""
    id: int
    manuscript_id: str
    title: str
    article_type: ArticleType
    status: ManuscriptStatus
    submitter_id: int
    editor_id: Optional[int] = None
    screened_at: Optional[datetime] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EditorAssign(BaseModel):
    editor_id: int


class EditorDecision(BaseModel):
    decision: ManuscriptStatus   # accepted | rejected | revision_required
    note: Optional[str] = None
