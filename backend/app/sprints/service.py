"""Sprint business logic."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.issues.models import Issue
from app.projects.models import WorkflowStatus, StatusCategory
from app.sprints.models import Sprint, SprintStatus
from app.sprints.schemas import SprintCreate, SprintUpdate


async def create_sprint(db: AsyncSession, project_id: UUID, data: SprintCreate, user: User) -> Sprint:
    """Create a new sprint in a project."""
    # Permission check: user must be a developer or higher
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager", "developer"):
        raise HTTPException(403, "Only project members can create sprints")

    sprint = Sprint(
        project_id=project_id,
        name=data.name,
        goal=data.goal,
        start_date=data.start_date,
        end_date=data.end_date,
        status=SprintStatus.planning,
    )
    db.add(sprint)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def get_sprints(db: AsyncSession, project_id: UUID, user: User, status_filter: str | None = None) -> list[Sprint]:
    """Get all sprints for a project, optionally filtered by status."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role is None:
        raise HTTPException(403, "You are not a member of this project")

    query = select(Sprint).where(Sprint.project_id == project_id)
    if status_filter:
        query = query.where(Sprint.status == status_filter)
    query = query.order_by(Sprint.created_at.desc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_sprint(db: AsyncSession, project_id: UUID, sprint_id: UUID, user: User) -> Sprint:
    """Get a specific sprint by ID."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role is None:
        raise HTTPException(403, "You are not a member of this project")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")
    return sprint


async def update_sprint(
    db: AsyncSession, project_id: UUID, sprint_id: UUID, data: SprintUpdate, user: User
) -> Sprint:
    """Update sprint details (name, goal, dates). Cannot update status here."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager", "developer"):
        raise HTTPException(403, "Only project members can update sprints")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")

    # Cannot update active or completed sprints
    if sprint.status != SprintStatus.planning:
        raise HTTPException(422, "Only planning sprints can be updated")

    if data.name is not None:
        sprint.name = data.name
    if data.goal is not None:
        sprint.goal = data.goal
    if data.start_date is not None:
        sprint.start_date = data.start_date
    if data.end_date is not None:
        sprint.end_date = data.end_date

    sprint.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def start_sprint(db: AsyncSession, project_id: UUID, sprint_id: UUID, user: User) -> Sprint:
    """Transition a planning sprint to active. Only one active sprint per project allowed."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager"):
        raise HTTPException(403, "Only project managers can start sprints")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")

    if sprint.status != SprintStatus.planning:
        raise HTTPException(422, "Only planning sprints can be started")

    # Check if there's already an active sprint
    result = await db.execute(
        select(Sprint).where(
            and_(Sprint.project_id == project_id, Sprint.status == SprintStatus.active)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(422, "Project already has an active sprint")

    sprint.status = SprintStatus.active
    sprint.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def complete_sprint(db: AsyncSession, project_id: UUID, sprint_id: UUID, user: User) -> Sprint:
    """Transition an active sprint to completed. Incomplete issues return to backlog."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager"):
        raise HTTPException(403, "Only project managers can complete sprints")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")

    if sprint.status != SprintStatus.active:
        raise HTTPException(422, "Only active sprints can be completed")

    # Find all unfinished issues (status.category != 'done') and move them to backlog
    incomplete_statuses = (
        await db.execute(
            select(WorkflowStatus.id).where(
                and_(
                    WorkflowStatus.project_id == project_id,
                    WorkflowStatus.category != StatusCategory.done,
                )
            )
        )
    ).scalars().all()

    if incomplete_statuses:
        await db.execute(
            update(Issue)
            .where(
                and_(
                    Issue.sprint_id == sprint_id,
                    Issue.status_id.in_(incomplete_statuses),
                )
            )
            .values(sprint_id=None)
        )

    sprint.status = SprintStatus.completed
    sprint.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def delete_sprint(db: AsyncSession, project_id: UUID, sprint_id: UUID, user: User) -> None:
    """Delete a sprint. Only planning sprints can be deleted."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager"):
        raise HTTPException(403, "Only project managers can delete sprints")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")

    if sprint.status != SprintStatus.planning:
        raise HTTPException(422, "Only planning sprints can be deleted")

    await db.delete(sprint)
    await db.commit()


async def add_issues_to_sprint(
    db: AsyncSession, project_id: UUID, sprint_id: UUID, issue_ids: list[UUID], user: User
) -> int:
    """Add multiple issues to a sprint. Returns count of updated issues."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager", "developer"):
        raise HTTPException(403, "Only project members can manage sprint issues")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")

    # Update all issues that belong to this project
    stmt = (
        update(Issue)
        .where(
            and_(
                Issue.id.in_(issue_ids),
                Issue.project_id == project_id,
            )
        )
        .values(sprint_id=sprint_id)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount


async def remove_issue_from_sprint(
    db: AsyncSession, project_id: UUID, sprint_id: UUID, issue_id: UUID, user: User
) -> None:
    """Remove an issue from a sprint (move to backlog)."""
    from app.projects.service import get_user_role_in_project
    role = await get_user_role_in_project(db, project_id, user.id)
    if role not in ("admin", "project_manager", "developer"):
        raise HTTPException(403, "Only project members can manage sprint issues")

    sprint = await db.get(Sprint, sprint_id)
    if not sprint or sprint.project_id != project_id:
        raise HTTPException(404, "Sprint not found")

    issue = await db.get(Issue, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(404, "Issue not found")

    issue.sprint_id = None
    await db.commit()
