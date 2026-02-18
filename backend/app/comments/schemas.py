"""Comment schemas for API request/response."""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class AuthorBrief(BaseModel):
    """Minimal author info for comments."""
    id: UUID
    name: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    """Request schema for creating a comment."""
    content: str = Field(..., min_length=1, max_length=10000)


class CommentUpdate(BaseModel):
    """Request schema for updating a comment."""
    content: str = Field(..., min_length=1, max_length=10000)


class CommentResponse(BaseModel):
    """Response schema for a comment."""
    id: UUID
    issue_id: UUID
    author: AuthorBrief
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
