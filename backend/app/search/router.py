"""Search and saved filters API router."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.issues import service as issues_service
from app.issues import schemas as issues_schemas
from app.projects import service as project_service
from app.search import schemas, service

router = APIRouter(prefix="/api/v1/projects/{project_id}", tags=["search"])


def _to_list_item(issue):
    """Convert Issue to IssueListItem."""
    return issues_schemas.IssueListItem(
        id=str(issue.id),
        project_id=str(issue.project_id),
        type=issue.type.value,
        key=issue.key,
        title=issue.title,
        status=issues_schemas.StatusBrief(
            id=str(issue.status.id),
            name=issue.status.name,
            category=issue.status.category.value,
        ),
        priority=issue.priority.value,
        assignee=issues_schemas.UserBrief(
            id=str(issue.assignee.id),
            name=issue.assignee.name,
            email=issue.assignee.email,
            avatar_url=issue.assignee.avatar_url,
        ) if issue.assignee else None,
        story_points=issue.story_points,
        due_date=issue.due_date,
        label_count=len(issue.labels),
        created_at=issue.created_at,
    )


@router.get("/search", response_model=issues_schemas.IssueListResponse)
async def search_issues(
    project_id: UUID,
    q: str | None = Query(None, description="Search text (searches title and key)"),
    type: str | None = Query(None),
    status_id: UUID | None = Query(None),
    priority: str | None = Query(None),
    assignee_id: UUID | None = Query(None),
    sprint_id: UUID | None = Query(None),
    label_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search issues with filters and text query."""
    await project_service.get_project(db, project_id, current_user)
    issues, total = await issues_service.get_issues(
        db, project_id, page, size, type, status_id, priority, assignee_id, sprint_id, label_id, q
    )
    return issues_schemas.IssueListResponse(
        items=[_to_list_item(i) for i in issues],
        total=total,
        page=page,
        size=size,
    )


@router.get("/filters/saved", response_model=list[schemas.SavedFilterResponse])
async def list_saved_filters(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List saved filters for current user in project."""
    await project_service.get_project(db, project_id, current_user)
    filters = await service.get_saved_filters(db, project_id, current_user.id)
    return [
        schemas.SavedFilterResponse(
            id=str(f.id),
            name=f.name,
            filters=f.filters,
            created_at=f.created_at,
        )
        for f in filters
    ]


@router.post("/filters/saved", response_model=schemas.SavedFilterResponse, status_code=201)
async def create_saved_filter(
    project_id: UUID,
    data: schemas.SavedFilterCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new saved filter."""
    await project_service.get_project(db, project_id, current_user)
    saved_filter = await service.create_saved_filter(db, project_id, current_user, data)
    return schemas.SavedFilterResponse(
        id=str(saved_filter.id),
        name=saved_filter.name,
        filters=saved_filter.filters,
        created_at=saved_filter.created_at,
    )


@router.delete("/filters/saved/{filter_id}", status_code=204)
async def delete_saved_filter(
    project_id: UUID,
    filter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved filter."""
    await project_service.get_project(db, project_id, current_user)
    await service.delete_saved_filter(db, filter_id, current_user.id)
