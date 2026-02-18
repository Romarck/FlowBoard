"""Pydantic schemas for attachment API responses."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserInfo(BaseModel):
    """Minimal user info for attachment response."""

    id: UUID
    name: str
    avatar_url: str | None = None


class AttachmentResponse(BaseModel):
    """Response schema for attachment."""

    id: UUID
    issue_id: UUID
    filename: str
    size: int  # bytes
    mime_type: str
    url: str  # /uploads/{filepath}
    created_at: datetime
    uploader: UserInfo

    model_config = {"from_attributes": True}
