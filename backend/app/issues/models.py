"""Issue, IssueLabel, IssueRelation, and IssueHistory models."""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class IssueType(str, enum.Enum):
    epic = "epic"
    story = "story"
    task = "task"
    bug = "bug"
    subtask = "subtask"


class IssuePriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class RelationType(str, enum.Enum):
    blocks = "blocks"
    is_blocked_by = "is_blocked_by"
    relates_to = "relates_to"


class Issue(Base):
    __tablename__ = "issues"
    __table_args__ = (
        Index("idx_issues_project_id", "project_id"),
        Index("idx_issues_status_id", "status_id"),
        Index("idx_issues_assignee_id", "assignee_id"),
        Index("idx_issues_sprint_id", "sprint_id"),
        Index("idx_issues_parent_id", "parent_id"),
        Index("idx_issues_type", "type"),
        Index("idx_issues_priority", "priority"),
        Index("idx_issues_position", "project_id", "status_id", "position"),
        Index("idx_issues_key", "key"),
        UniqueConstraint("project_id", "key", name="uq_issues_project_key"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[IssueType] = mapped_column(
        Enum(IssueType, name="issue_type", create_constraint=False, native_enum=True),
        nullable=False,
    )
    key: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflow_statuses.id"), nullable=False
    )
    priority: Mapped[IssuePriority] = mapped_column(
        Enum(IssuePriority, name="issue_priority", create_constraint=False, native_enum=True),
        nullable=False,
        server_default="medium",
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sprint_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True
    )
    story_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="issues")
    status = relationship("WorkflowStatus", lazy="selectin")
    assignee = relationship("User", foreign_keys=[assignee_id], lazy="selectin")
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="selectin")
    sprint = relationship("Sprint", back_populates="issues")
    parent = relationship("Issue", remote_side="Issue.id", lazy="selectin")
    labels = relationship("Label", secondary="issue_labels", lazy="selectin")
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan", lazy="selectin")
    attachments = relationship("Attachment", back_populates="issue", cascade="all, delete-orphan", lazy="selectin")
    history = relationship("IssueHistory", back_populates="issue", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Issue {self.key}: {self.title[:40]}>"


class IssueLabel(Base):
    """Association table for the many-to-many relationship between issues and labels."""

    __tablename__ = "issue_labels"

    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), primary_key=True
    )
    label_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True
    )


class IssueRelation(Base):
    __tablename__ = "issue_relations"
    __table_args__ = (
        CheckConstraint("source_issue_id != target_issue_id", name="ck_issue_relations_no_self"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
    )
    target_issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
    )
    relation_type: Mapped[RelationType] = mapped_column(
        Enum(RelationType, name="relation_type", create_constraint=False, native_enum=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    source_issue = relationship("Issue", foreign_keys=[source_issue_id], lazy="selectin")
    target_issue = relationship("Issue", foreign_keys=[target_issue_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"<IssueRelation {self.source_issue_id} {self.relation_type.value} {self.target_issue_id}>"


class IssueHistory(Base):
    __tablename__ = "issue_history"
    __table_args__ = (
        Index("idx_issue_history_issue_id", "issue_id", "created_at", postgresql_ops={"created_at": "DESC"}),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    field: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    issue = relationship("Issue", back_populates="history")
    user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<IssueHistory {self.issue_id} field={self.field}>"
