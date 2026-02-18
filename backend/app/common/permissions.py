"""Project-level permission dependencies."""
from uuid import UUID

from fastapi import Depends, HTTPException, Path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.projects.models import ProjectMember

ROLE_HIERARCHY = {
    "admin": 4,
    "project_manager": 3,
    "developer": 2,
    "viewer": 1,
}


async def _get_member(
    db: AsyncSession, project_id: UUID, user_id: UUID
) -> ProjectMember | None:
    """Get a project member by project_id and user_id."""
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


def require_project_role(min_role: str):
    """Dependency factory: ensures current user has at least min_role in the project."""

    async def _check(
        project_id: UUID = Path(),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> ProjectMember:
        member = await _get_member(db, project_id, current_user.id)
        if not member:
            raise HTTPException(403, "You are not a member of this project")
        if ROLE_HIERARCHY.get(member.role, 0) < ROLE_HIERARCHY.get(min_role, 0):
            raise HTTPException(
                403, f"This action requires at least '{min_role}' role"
            )
        return member

    return Depends(_check)
