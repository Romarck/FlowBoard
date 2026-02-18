"""Project, ProjectMember, WorkflowStatus, and Label models."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProjectMethodology(str, enum.Enum):
    kanban = "kanban"
    scrum = "scrum"


class StatusCategory(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    methodology: Mapped[ProjectMethodology] = mapped_column(
        Enum(ProjectMethodology, name="project_methodology", create_constraint=False, native_enum=True),
        nullable=False,
        server_default="kanban",
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    issue_counter: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="owned_projects", lazy="selectin")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    workflow_statuses = relationship(
        "WorkflowStatus", back_populates="project", cascade="all, delete-orphan", lazy="selectin"
    )
    labels = relationship("Label", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    sprints = relationship("Sprint", back_populates="project", cascade="all, delete-orphan", lazy="selectin")
    issues = relationship("Issue", back_populates="project", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Project {self.key}: {self.name}>"


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_members_project_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(
        Enum("admin", "project_manager", "developer", "viewer", name="user_role", create_type=False),
        nullable=False,
        server_default="developer",
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")

    def __repr__(self) -> str:
        return f"<ProjectMember project={self.project_id} user={self.user_id}>"


class WorkflowStatus(Base):
    __tablename__ = "workflow_statuses"
    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_workflow_statuses_project_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[StatusCategory] = mapped_column(
        Enum(StatusCategory, name="status_category", create_constraint=False, native_enum=True),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    wip_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="workflow_statuses")

    def __repr__(self) -> str:
        return f"<WorkflowStatus {self.name} ({self.category.value})>"


class Label(Base):
    __tablename__ = "labels"
    __table_args__ = (
        UniqueConstraint("project_id", "name", name="uq_labels_project_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False, server_default="#6B7280")

    # Relationships
    project = relationship("Project", back_populates="labels")

    def __repr__(self) -> str:
        return f"<Label {self.name}>"
