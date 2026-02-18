"""Sprints API router."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.sprints import schemas, service

router = APIRouter(prefix="/api/v1/projects/{project_id}/sprints", tags=["sprints"])


def _to_response(sprint) -> schemas.SprintResponse:
    """Convert Sprint model to response schema."""
    issue_count = len(sprint.issues) if sprint.issues else 0
    return schemas.SprintResponse(
        id=str(sprint.id),
        project_id=str(sprint.project_id),
        name=sprint.name,
        goal=sprint.goal,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        status=sprint.status.value,
        issue_count=issue_count,
        created_at=sprint.created_at,
        updated_at=sprint.updated_at,
    )


@router.post("", response_model=schemas.SprintResponse, status_code=201)
async def create_sprint(
    project_id: UUID,
    data: schemas.SprintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new sprint in the project."""
    sprint = await service.create_sprint(db, project_id, data, current_user)
    return _to_response(sprint)


@router.get("", response_model=list[schemas.SprintResponse])
async def list_sprints(
    project_id: UUID,
    status: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all sprints for the project, optionally filtered by status."""
    sprints = await service.get_sprints(db, project_id, current_user, status)
    return [_to_response(s) for s in sprints]


@router.get("/{sprint_id}", response_model=schemas.SprintResponse)
async def get_sprint(
    project_id: UUID,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific sprint by ID."""
    sprint = await service.get_sprint(db, project_id, sprint_id, current_user)
    return _to_response(sprint)


@router.patch("/{sprint_id}", response_model=schemas.SprintResponse)
async def update_sprint(
    project_id: UUID,
    sprint_id: UUID,
    data: schemas.SprintUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update sprint details (name, goal, dates)."""
    sprint = await service.update_sprint(db, project_id, sprint_id, data, current_user)
    return _to_response(sprint)


@router.post("/{sprint_id}/start", response_model=schemas.SprintResponse)
async def start_sprint(
    project_id: UUID,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Transition a planning sprint to active status."""
    sprint = await service.start_sprint(db, project_id, sprint_id, current_user)
    return _to_response(sprint)


@router.post("/{sprint_id}/complete", response_model=schemas.SprintResponse)
async def complete_sprint(
    project_id: UUID,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Transition an active sprint to completed status. Incomplete issues return to backlog."""
    sprint = await service.complete_sprint(db, project_id, sprint_id, current_user)
    return _to_response(sprint)


@router.delete("/{sprint_id}", status_code=204)
async def delete_sprint(
    project_id: UUID,
    sprint_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a sprint. Only planning sprints can be deleted."""
    await service.delete_sprint(db, project_id, sprint_id, current_user)


@router.post("/{sprint_id}/issues")
async def add_issues_to_sprint(
    project_id: UUID,
    sprint_id: UUID,
    data: schemas.SprintIssueMove,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add multiple issues to a sprint."""
    issue_ids = [UUID(issue_id) for issue_id in data.issue_ids]
    count = await service.add_issues_to_sprint(db, project_id, sprint_id, issue_ids, current_user)
    return {"count": count}


@router.delete("/{sprint_id}/issues/{issue_id}", status_code=204)
async def remove_issue_from_sprint(
    project_id: UUID,
    sprint_id: UUID,
    issue_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove an issue from a sprint (move to backlog)."""
    await service.remove_issue_from_sprint(db, project_id, sprint_id, issue_id, current_user)
