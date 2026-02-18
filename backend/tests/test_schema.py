"""Tests to verify that all 14 SQLAlchemy models register correctly in Base.metadata."""

from app.database import Base

# Import all models to ensure they register with Base.metadata
from app.auth.models import User  # noqa: F401
from app.projects.models import Label, Project, ProjectMember, WorkflowStatus  # noqa: F401
from app.sprints.models import Sprint  # noqa: F401
from app.issues.models import Issue, IssueHistory, IssueLabel, IssueRelation  # noqa: F401
from app.comments.models import Comment  # noqa: F401
from app.attachments.models import Attachment  # noqa: F401
from app.notifications.models import Notification  # noqa: F401
from app.search.models import SavedFilter  # noqa: F401


EXPECTED_TABLES = [
    "users",
    "projects",
    "project_members",
    "workflow_statuses",
    "labels",
    "sprints",
    "issues",
    "issue_labels",
    "issue_relations",
    "issue_history",
    "comments",
    "attachments",
    "notifications",
    "saved_filters",
]


def test_all_14_tables_registered():
    """All 14 tables from the DDL must be registered in Base.metadata."""
    registered = set(Base.metadata.tables.keys())
    for table_name in EXPECTED_TABLES:
        assert table_name in registered, f"Table '{table_name}' not found in metadata. Got: {registered}"
    assert len(registered) == 14, f"Expected 14 tables, got {len(registered)}: {registered}"


def test_users_table_columns():
    """Users table must have all required columns."""
    table = Base.metadata.tables["users"]
    column_names = {c.name for c in table.columns}
    required = {"id", "email", "name", "password_hash", "avatar_url", "role", "is_active", "created_at", "updated_at"}
    assert required.issubset(column_names), f"Missing columns: {required - column_names}"


def test_issues_table_columns():
    """Issues table must have all required columns from the DDL."""
    table = Base.metadata.tables["issues"]
    column_names = {c.name for c in table.columns}
    required = {
        "id", "project_id", "type", "key", "title", "description", "status_id",
        "priority", "assignee_id", "reporter_id", "sprint_id", "parent_id",
        "story_points", "due_date", "position", "created_at", "updated_at",
    }
    assert required.issubset(column_names), f"Missing columns: {required - column_names}"


def test_issue_labels_composite_pk():
    """issue_labels must have a composite primary key (issue_id, label_id)."""
    table = Base.metadata.tables["issue_labels"]
    pk_columns = {c.name for c in table.primary_key.columns}
    assert pk_columns == {"issue_id", "label_id"}


def test_saved_filters_has_jsonb_column():
    """saved_filters must have a JSONB 'filters' column."""
    table = Base.metadata.tables["saved_filters"]
    filters_col = table.c.filters
    assert filters_col is not None
    assert "JSON" in str(filters_col.type).upper()


def test_notifications_table_columns():
    """Notifications table must have required columns including 'read' boolean."""
    table = Base.metadata.tables["notifications"]
    column_names = {c.name for c in table.columns}
    required = {"id", "user_id", "issue_id", "type", "title", "message", "read", "created_at"}
    assert required.issubset(column_names), f"Missing columns: {required - column_names}"
