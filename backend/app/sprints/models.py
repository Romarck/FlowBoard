"""Sprint model — maps to the 'sprints' table."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SprintStatus(str, enum.Enum):
    planning = "planning"
    active = "active"
    completed = "completed"


class Sprint(Base):
    __tablename__ = "sprints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[SprintStatus] = mapped_column(
        Enum(SprintStatus, name="sprint_status", create_constraint=False, native_enum=True),
        nullable=False,
        server_default="planning",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="sprints")
    issues = relationship("Issue", back_populates="sprint", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Sprint {self.name} ({self.status.value})>"
