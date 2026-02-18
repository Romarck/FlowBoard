"""Pydantic schemas for project endpoints."""

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

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


class MemberResponse(BaseModel):
    """Response body representing a project member."""

    user_id: str
    name: str
    email: str
    avatar_url: str | None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class MemberAdd(BaseModel):
    """Request body for adding a member to a project."""

    email: EmailStr
    role: str = "developer"

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate that role is one of the allowed values."""
        valid = {"admin", "project_manager", "developer", "viewer"}
        if v not in valid:
            raise ValueError(f"Role must be one of: {', '.join(sorted(valid))}")
        return v


class MemberUpdate(BaseModel):
    """Request body for updating a member's role."""

    role: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Validate that role is one of the allowed values."""
        valid = {"admin", "project_manager", "developer", "viewer"}
        if v not in valid:
            raise ValueError(f"Role must be one of: {', '.join(sorted(valid))}")
        return v


class StatusResponse(BaseModel):
    """Response body representing a workflow status."""

    id: str
    name: str
    category: str  # "todo" | "in_progress" | "done"
    position: int
    wip_limit: int | None

    model_config = {"from_attributes": True}


class LabelCreate(BaseModel):
    """Request body for creating a label."""

    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default="#6B7280")

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str) -> str:
        """Validate that color is a valid hex string."""
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex string (e.g. #FF5733)")
        return v.upper()


class LabelUpdate(BaseModel):
    """Request body for updating a label."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        """Validate that color is a valid hex string."""
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex string (e.g. #FF5733)")
        return v.upper() if v else v


class LabelResponse(BaseModel):
    """Response body representing a label."""

    id: str
    name: str
    color: str

    model_config = {"from_attributes": True}
