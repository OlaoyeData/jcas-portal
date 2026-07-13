from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.review import ReviewStatus, ReviewRecommendation


class ReviewAssignmentCreate(BaseModel):
    reviewer_id: int
    deadline: Optional[datetime] = None


class ReviewAssignmentOut(BaseModel):
    id: int
    manuscript_id: int
    reviewer_id: int
    status: ReviewStatus
    deadline: Optional[datetime] = None
    assigned_at: datetime
    responded_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    round_number: int

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    score_originality:  Optional[int] = None
    score_technical:    Optional[int] = None
    score_clarity:      Optional[int] = None
    score_references:   Optional[int] = None
    recommendation:     Optional[ReviewRecommendation] = None
    comments_to_author: Optional[str] = None
    comments_to_editor: Optional[str] = None
    conflict_declaration: Optional[str] = None
    is_draft: bool = True

    @field_validator("score_originality", "score_technical",
                     "score_clarity", "score_references", mode="before")
    @classmethod
    def valid_score(cls, v):
        if v is not None and v not in (1, 2, 3, 4):
            raise ValueError("Score must be 1 (Poor), 2 (Fair), 3 (Good), or 4 (Excellent)")
        return v

    @field_validator("comments_to_author")
    @classmethod
    def comments_required_if_submitting(cls, v):
        return v


class ReviewFileOut(BaseModel):
    id: int
    filename: str
    file_size: Optional[int] = None
    shared_with_author: bool = False
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class ReviewOut(BaseModel):
    id: int
    assignment_id: int
    score_originality:  Optional[int] = None
    score_technical:    Optional[int] = None
    score_clarity:      Optional[int] = None
    score_references:   Optional[int] = None
    overall_score:      Optional[float] = None
    recommendation:     Optional[ReviewRecommendation] = None
    comments_to_author: Optional[str] = None
    comments_to_editor: Optional[str] = None
    conflict_declaration: Optional[str] = None
    is_draft: bool
    submitted_at: Optional[datetime] = None
    updated_at: datetime
    files: List[ReviewFileOut] = []

    model_config = {"from_attributes": True}


class ReviewerInvitationResponse(BaseModel):
    accept: bool
    decline_reason: Optional[str] = None
