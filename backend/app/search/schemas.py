"""Pydantic schemas for search endpoints."""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class SavedFilterCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    filters: dict = Field(..., description="JSON with filters: {type, priority, assignee_id, status_id, sprint_id, label_id, search}")


class SavedFilterResponse(BaseModel):
    id: str
    name: str
    filters: dict
    created_at: datetime
    model_config = {"from_attributes": True}
