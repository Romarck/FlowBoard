"""Pydantic schemas for project endpoints."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.projects.models import ProjectMethodology


class WorkflowStatusResponse(BaseModel):
    """Response body representing a workflow status."""

    id: str
    name: str
    category: str
    position: int
    wip_limit: int | None

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    """Request body for POST /api/v1/projects."""

    name: str = Field(min_length=2, max_length=255)
    key: str | None = Field(default=None, min_length=2, max_length=10)
    description: str | None = None
    methodology: ProjectMethodology = ProjectMethodology.kanban


class ProjectUpdate(BaseModel):
    """Request body for PATCH /api/v1/projects/{id}."""

    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = None
    methodology: ProjectMethodology | None = None


class ProjectResponse(BaseModel):
    """Response body representing a full project (with details)."""

    id: str
    name: str
    key: str
    description: str | None
    methodology: str
    owner_id: str
    issue_counter: int
    member_count: int
    created_at: datetime
    updated_at: datetime
    workflow_statuses: list[WorkflowStatusResponse]

    model_config = {"from_attributes": True}


class ProjectListItem(BaseModel):
    """Response body representing a project in a list."""

    id: str
    name: str
    key: str
    description: str | None
    methodology: str
    member_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    """Response body for GET /api/v1/projects (paginated list)."""

    items: list[ProjectListItem]
    total: int
    page: int
    size: int
