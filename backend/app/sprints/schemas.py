"""Pydantic schemas for sprint endpoints."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.sprints.models import SprintStatus


class SprintCreate(BaseModel):
    """Request body for creating a sprint."""

    name: str = Field(min_length=1, max_length=255)
    goal: Optional[str] = Field(default=None, max_length=2000)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SprintUpdate(BaseModel):
    """Request body for updating a sprint."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    goal: Optional[str] = Field(default=None, max_length=2000)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class SprintResponse(BaseModel):
    """Response body representing a sprint."""

    id: str
    project_id: str
    name: str
    goal: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    status: str  # 'planning', 'active', 'completed'
    issue_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SprintIssueMove(BaseModel):
    """Request body for adding issues to a sprint."""

    issue_ids: list[str]
