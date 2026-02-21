"""Initial schema — all 14 tables, 8 enums, extensions, and indexes.

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-02-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Extensions ---
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # --- Enums (created via SQL to be idempotent; create_type=False prevents
    #     op.create_table() from trying to recreate them) ---
    op.execute("DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'developer', 'viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE project_methodology AS ENUM ('kanban', 'scrum'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE issue_type AS ENUM ('epic', 'story', 'task', 'bug', 'subtask'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE issue_priority AS ENUM ('critical', 'high', 'medium', 'low'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE status_category AS ENUM ('todo', 'in_progress', 'done'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE relation_type AS ENUM ('blocks', 'is_blocked_by', 'relates_to'); EXCEPTION WHEN duplicate_object THEN null; END $$")
    op.execute("DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('assigned', 'mentioned', 'status_changed', 'commented'); EXCEPTION WHEN duplicate_object THEN null; END $$")

    user_role = sa.Enum("admin", "project_manager", "developer", "viewer", name="user_role", create_type=False)
    project_methodology = sa.Enum("kanban", "scrum", name="project_methodology", create_type=False)
    issue_type = sa.Enum("epic", "story", "task", "bug", "subtask", name="issue_type", create_type=False)
    issue_priority = sa.Enum("critical", "high", "medium", "low", name="issue_priority", create_type=False)
    status_category = sa.Enum("todo", "in_progress", "done", name="status_category", create_type=False)
    sprint_status = sa.Enum("planning", "active", "completed", name="sprint_status", create_type=False)
    relation_type = sa.Enum("blocks", "is_blocked_by", "relates_to", name="relation_type", create_type=False)
    notification_type = sa.Enum("assigned", "mentioned", "status_changed", "commented", name="notification_type", create_type=False)

    # --- Table: users ---
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("role", user_role, nullable=False, server_default="developer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Table: projects ---
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key", sa.String(10), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("methodology", project_methodology, nullable=False, server_default="kanban"),
        sa.Column("owner_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("issue_counter", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Table: project_members ---
    op.create_table(
        "project_members",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="developer"),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "user_id", name="uq_project_members_project_user"),
    )
    op.create_index("idx_project_members_user_id", "project_members", ["user_id"])

    # --- Table: workflow_statuses ---
    op.create_table(
        "workflow_statuses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("category", status_category, nullable=False),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.Column("wip_limit", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "name", name="uq_workflow_statuses_project_name"),
    )

    # --- Table: labels ---
    op.create_table(
        "labels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("color", sa.String(7), nullable=False, server_default="#6B7280"),
        sa.UniqueConstraint("project_id", "name", name="uq_labels_project_name"),
    )

    # --- Table: sprints ---
    op.create_table(
        "sprints",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("goal", sa.Text, nullable=True),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("status", sprint_status, nullable=False, server_default="planning"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_sprints_project_status", "sprints", ["project_id", "status"])

    # --- Table: issues ---
    op.create_table(
        "issues",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("type", issue_type, nullable=False),
        sa.Column("key", sa.String(20), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status_id", UUID(as_uuid=True), sa.ForeignKey("workflow_statuses.id"), nullable=False),
        sa.Column("priority", issue_priority, nullable=False, server_default="medium"),
        sa.Column(
            "assignee_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("reporter_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "sprint_id", UUID(as_uuid=True), sa.ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column(
            "parent_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("story_points", sa.Integer, nullable=True),
        sa.Column("due_date", sa.Date, nullable=True),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("project_id", "key", name="uq_issues_project_key"),
    )
    op.create_index("idx_issues_project_id", "issues", ["project_id"])
    op.create_index("idx_issues_status_id", "issues", ["status_id"])
    op.create_index("idx_issues_assignee_id", "issues", ["assignee_id"])
    op.create_index("idx_issues_sprint_id", "issues", ["sprint_id"])
    op.create_index("idx_issues_parent_id", "issues", ["parent_id"])
    op.create_index("idx_issues_type", "issues", ["type"])
    op.create_index("idx_issues_priority", "issues", ["priority"])
    op.create_index("idx_issues_position", "issues", ["project_id", "status_id", "position"])
    op.create_index("idx_issues_key", "issues", ["key"])
    # Trigram index for fulltext search on title
    op.execute("CREATE INDEX idx_issues_title_trgm ON issues USING gin(title gin_trgm_ops)")

    # --- Table: issue_labels ---
    op.create_table(
        "issue_labels",
        sa.Column(
            "issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), primary_key=True
        ),
        sa.Column(
            "label_id", UUID(as_uuid=True), sa.ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True
        ),
    )

    # --- Table: issue_relations ---
    op.create_table(
        "issue_relations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "source_issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "target_issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("relation_type", relation_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("source_issue_id != target_issue_id", name="ck_issue_relations_no_self"),
    )

    # --- Table: issue_history ---
    op.create_table(
        "issue_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("field", sa.String(100), nullable=False),
        sa.Column("old_value", sa.Text, nullable=True),
        sa.Column("new_value", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_issue_history_issue_id", "issue_history", ["issue_id", sa.text("created_at DESC")])

    # --- Table: comments ---
    op.create_table(
        "comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("author_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_comments_issue_id", "comments", ["issue_id"])

    # --- Table: attachments ---
    op.create_table(
        "attachments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("uploader_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("filepath", sa.String(500), nullable=False),
        sa.Column("size", sa.Integer, nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # --- Table: notifications ---
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "issue_id", UUID(as_uuid=True), sa.ForeignKey("issues.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column("type", notification_type, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text, nullable=True),
        sa.Column("read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(
        "idx_notifications_user_id", "notifications", ["user_id", "read", sa.text("created_at DESC")]
    )

    # --- Table: saved_filters ---
    op.create_table(
        "saved_filters",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "project_id", UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("filters", JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("saved_filters")
    op.drop_table("notifications")
    op.drop_table("attachments")
    op.drop_table("comments")
    op.drop_table("issue_history")
    op.drop_table("issue_relations")
    op.drop_table("issue_labels")
    op.drop_table("issues")
    op.drop_table("sprints")
    op.drop_table("labels")
    op.drop_table("workflow_statuses")
    op.drop_table("project_members")
    op.drop_table("projects")
    op.drop_table("users")

    # Drop enums
    for enum_name in [
        "notification_type",
        "relation_type",
        "sprint_status",
        "status_category",
        "issue_priority",
        "issue_type",
        "project_methodology",
        "user_role",
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)

    # Drop extensions
    op.execute('DROP EXTENSION IF EXISTS "pg_trgm"')
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
