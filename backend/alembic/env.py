"""Alembic env.py — async migration runner for FlowBoard."""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import settings
from app.database import Base

# Import ALL models so that Base.metadata is fully populated
from app.auth.models import User  # noqa: F401
from app.projects.models import Label, Project, ProjectMember, WorkflowStatus  # noqa: F401
from app.sprints.models import Sprint  # noqa: F401
from app.issues.models import Issue, IssueHistory, IssueLabel, IssueRelation  # noqa: F401
from app.comments.models import Comment  # noqa: F401
from app.attachments.models import Attachment  # noqa: F401
from app.notifications.models import Notification  # noqa: F401
from app.search.models import SavedFilter  # noqa: F401

config = context.config

# Override sqlalchemy.url from settings so .env is the single source of truth
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — generates SQL script without a live DB."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with an async engine."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
