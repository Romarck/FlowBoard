"""Project business logic."""
import re
import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User as AuthUser
from app.projects.models import Project, ProjectMember, WorkflowStatus, StatusCategory
from app.projects.schemas import ProjectCreate, ProjectUpdate

DEFAULT_STATUSES = [
    {"name": "To Do", "category": StatusCategory.todo, "position": 0},
    {"name": "In Progress", "category": StatusCategory.in_progress, "position": 1},
    {"name": "In Review", "category": StatusCategory.in_progress, "position": 2},
    {"name": "Done", "category": StatusCategory.done, "position": 3},
]


def generate_project_key(name: str) -> str:
    words = name.strip().split()
    if len(words) == 1:
        key = words[0][:3]
    else:
        key = "".join(w[0] for w in words[:4])
    return re.sub(r"[^A-Z0-9]", "", key.upper())[:10] or "PROJ"


async def create_project(db: AsyncSession, data: ProjectCreate, owner: AuthUser) -> Project:
    key = data.key.upper() if data.key else generate_project_key(data.name)
    key = re.sub(r"[^A-Z0-9]", "", key)[:10]

    project = Project(
        name=data.name,
        key=key,
        description=data.description,
        methodology=data.methodology,
        owner_id=owner.id,
        issue_counter=0,
    )
    db.add(project)

    try:
        await db.flush()  # get project.id without committing
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "Project key already in use")

    # Add owner as admin member
    member = ProjectMember(project_id=project.id, user_id=owner.id, role="admin")
    db.add(member)

    # Create default workflow statuses
    for s in DEFAULT_STATUSES:
        ws = WorkflowStatus(project_id=project.id, **s)
        db.add(ws)

    await db.commit()
    await db.refresh(project)
    return project


async def get_projects(
    db: AsyncSession, user: AuthUser, page: int = 1, size: int = 20
) -> tuple[list[Project], int]:
    # Count total
    count_q = (
        select(func.count(Project.id))
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == user.id)
    )
    total = await db.scalar(count_q) or 0

    # Fetch page
    q = (
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == user.id)
        .offset((page - 1) * size)
        .limit(size)
        .order_by(Project.created_at.desc())
    )
    result = await db.execute(q)
    projects = list(result.scalars().all())
    return projects, total


async def get_project(db: AsyncSession, project_id: UUID, user: AuthUser) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    role = await get_user_role_in_project(db, project_id, user.id)
    if role is None:
        raise HTTPException(403, "You are not a member of this project")
    return project


async def get_user_role_in_project(
    db: AsyncSession, project_id: UUID, user_id: UUID
) -> str | None:
    result = await db.execute(
        select(ProjectMember.role).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    row = result.scalar_one_or_none()
    return row


async def update_project(
    db: AsyncSession, project: Project, data: ProjectUpdate, user: AuthUser
) -> Project:
    role = await get_user_role_in_project(db, project.id, user.id)
    if role not in ("admin", "project_manager"):
        raise HTTPException(403, "Only admins and project managers can update projects")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.methodology is not None:
        project.methodology = data.methodology
    project.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project: Project, user: AuthUser) -> None:
    role = await get_user_role_in_project(db, project.id, user.id)
    if role != "admin":
        raise HTTPException(403, "Only admins can delete projects")
    await db.delete(project)
    await db.commit()


async def get_members(db: AsyncSession, project_id: UUID) -> list[ProjectMember]:
    """Return all members of a project with their user data."""
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
    )
    return list(result.scalars().all())


async def add_member(
    db: AsyncSession,
    project: Project,
    email: str,
    role: str,
    requester: AuthUser,
) -> ProjectMember:
    """Add a user to the project by email."""
    # Find user by email
    result = await db.execute(select(AuthUser).where(AuthUser.email == email))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(404, "User not found")

    # Check if already a member
    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == target_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "User is already a member")

    member = ProjectMember(
        project_id=project.id,
        user_id=target_user.id,
        role=role,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def update_member_role(
    db: AsyncSession,
    project: Project,
    target_user_id: UUID,
    new_role: str,
    requester: AuthUser,
) -> ProjectMember:
    """Update a member's role. Owner cannot be demoted."""
    if target_user_id == project.owner_id:
        raise HTTPException(403, "Owner's role cannot be changed")

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == target_user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(404, "Member not found")

    member.role = new_role
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member(
    db: AsyncSession,
    project: Project,
    target_user_id: UUID,
    requester: AuthUser,
) -> None:
    """Remove a member. Owner cannot be removed."""
    if target_user_id == project.owner_id:
        raise HTTPException(403, "Owner cannot be removed from the project")

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == target_user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(404, "Member not found")

    await db.delete(member)
    await db.commit()
