"""Search and filter business logic."""
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.search.models import SavedFilter
from app.search.schemas import SavedFilterCreate


async def get_saved_filters(db: AsyncSession, project_id: UUID, user_id: UUID) -> list[SavedFilter]:
    """Get all saved filters for a user in a project."""
    result = await db.execute(
        select(SavedFilter)
        .where(SavedFilter.project_id == project_id, SavedFilter.user_id == user_id)
        .order_by(SavedFilter.created_at.desc())
    )
    return list(result.scalars().all())


async def create_saved_filter(
    db: AsyncSession, project_id: UUID, user: User, data: SavedFilterCreate
) -> SavedFilter:
    """Create a new saved filter."""
    filter_obj = SavedFilter(
        project_id=project_id,
        user_id=user.id,
        name=data.name,
        filters=data.filters,
    )
    db.add(filter_obj)
    await db.commit()
    await db.refresh(filter_obj)
    return filter_obj


async def delete_saved_filter(db: AsyncSession, filter_id: UUID, user_id: UUID) -> None:
    """Delete a saved filter (owner verification)."""
    filter_obj = await db.get(SavedFilter, filter_id)
    if not filter_obj or filter_obj.user_id != user_id:
        raise HTTPException(404, "Filter not found or you don't have permission to delete it")
    await db.delete(filter_obj)
    await db.commit()
