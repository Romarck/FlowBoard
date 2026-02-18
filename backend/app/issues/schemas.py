"""Pydantic schemas for issue endpoints."""
from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.issues.models import IssueType, IssuePriority


class UserBrief(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str | None
    model_config = {"from_attributes": True}


class StatusBrief(BaseModel):
    id: str
    name: str
    category: str
    model_config = {"from_attributes": True}


class LabelBrief(BaseModel):
    id: str
    name: str
    color: str
    model_config = {"from_attributes": True}


class SprintBrief(BaseModel):
    id: str
    name: str
    model_config = {"from_attributes": True}


class IssueBrief(BaseModel):
    """Minimal issue representation for parent/children."""
    id: str
    key: str
    title: str
    type: str
    priority: str
    model_config = {"from_attributes": True}


class IssueCreate(BaseModel):
    type: IssueType
    title: str = Field(min_length=1, max_length=500)
    description: str | None = None
    priority: IssuePriority = IssuePriority.medium
    status_id: UUID | None = None          # auto-assigned if None (first "todo" status)
    assignee_id: UUID | None = None
    sprint_id: UUID | None = None
    parent_id: UUID | None = None
    story_points: int | None = Field(None, ge=0, le=100)
    due_date: date | None = None
    label_ids: list[UUID] = []


class IssueUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    type: IssueType | None = None
    priority: IssuePriority | None = None
    status_id: UUID | None = None
    assignee_id: UUID | None = None
    sprint_id: UUID | None = None
    parent_id: UUID | None = None
    story_points: int | None = Field(None, ge=0, le=100)
    due_date: date | None = None
    label_ids: list[UUID] | None = None


class IssueResponse(BaseModel):
    id: str
    project_id: str
    type: str
    key: str
    title: str
    description: str | None
    status: StatusBrief
    priority: str
    assignee: UserBrief | None
    reporter: UserBrief
    sprint: SprintBrief | None
    parent: IssueBrief | None
    children: list[IssueBrief]
    labels: list[LabelBrief]
    story_points: int | None
    due_date: date | None
    position: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class IssueListItem(BaseModel):
    id: str
    project_id: str
    type: str
    key: str
    title: str
    status: StatusBrief
    priority: str
    assignee: UserBrief | None
    story_points: int | None
    due_date: date | None
    label_count: int
    created_at: datetime
    model_config = {"from_attributes": True}


class IssueListResponse(BaseModel):
    items: list[IssueListItem]
    total: int
    page: int
    size: int
