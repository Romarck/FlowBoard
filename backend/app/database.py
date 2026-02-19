"""Database engine, session factory, and declarative Base for FlowBoard."""

from datetime import datetime, timezone

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


@event.listens_for(Base, "init", propagate=True)
def _set_timestamp_defaults(target, args, kwargs):
    """Auto-set created_at/updated_at/joined_at on model init when not provided.

    SQLAlchemy's ``server_default`` only fires at INSERT time in the database,
    so Python-created model instances (e.g. in tests with mocked sessions)
    would have None for these fields. This listener injects Python-side
    defaults into kwargs before SQLAlchemy processes them.
    """
    now = None  # Lazy-evaluated only if needed
    for attr in ("created_at", "updated_at", "joined_at"):
        if attr not in kwargs and hasattr(type(target), attr):
            if now is None:
                now = datetime.now(timezone.utc)
            kwargs[attr] = now


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        yield session
