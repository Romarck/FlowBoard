"""Add reset token fields to users.

Revision ID: 002_add_reset_token_fields_to_users
Revises: 001_initial_schema
Create Date: 2026-02-18
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = "002_add_reset_token_fields_to_users"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add reset_token_hash and reset_token_expires columns to users table."""
    op.add_column(
        "users",
        sa.Column("reset_token_hash", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("reset_token_expires", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Remove reset token columns from users table."""
    op.drop_column("users", "reset_token_expires")
    op.drop_column("users", "reset_token_hash")
