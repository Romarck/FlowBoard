"""Pydantic schemas for notification endpoints."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """Notification response schema — returned to client."""

    id: str = Field(description="Notification UUID")
    type: str = Field(description="Notification type: assigned, mentioned, status_changed, commented")
    title: str = Field(description="Notification title")
    body: str | None = Field(None, description="Notification body/details")
    read: bool = Field(description="Whether notification has been read")
    issue_id: str | None = Field(None, description="Related issue UUID, if any")
    created_at: datetime = Field(description="Creation timestamp")

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    """Notification creation schema — used to create notifications."""

    user_id: UUID = Field(description="User to notify")
    issue_id: UUID | None = Field(None, description="Related issue")
    type: str = Field(description="Notification type")
    title: str = Field(description="Notification title")
    body: str | None = Field(None, description="Notification body")


class NotificationListResponse(BaseModel):
    """List of notifications with pagination."""

    items: list[NotificationResponse] = Field(description="Notification items")
    total: int = Field(description="Total count of notifications")


class MarkReadResponse(BaseModel):
    """Response when marking notification(s) as read."""

    count: int = Field(description="Number of notifications marked as read")
