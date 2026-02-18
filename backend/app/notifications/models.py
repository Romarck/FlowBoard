"""Notification model — maps to the 'notifications' table."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    assigned = "assigned"
    mentioned = "mentioned"
    status_changed = "status_changed"
    commented = "commented"


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index(
            "idx_notifications_user_id",
            "user_id",
            "read",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    issue_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=True
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type", create_constraint=False, native_enum=True),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    user = relationship("User", lazy="selectin")
    issue = relationship("Issue", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Notification {self.type.value} for user={self.user_id}>"
