"""Issues API router."""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.common.permissions import ROLE_HIERARCHY
from app.database import get_db
from app.issues import schemas, service
from app.issues.models import Issue
from app.projects import service as project_service

router = APIRouter(prefix="/api/v1/projects/{project_id}/issues", tags=["issues"])


def _to_response(issue: Issue, children: list[Issue]) -> schemas.IssueResponse:
    return schemas.IssueResponse(
        id=str(issue.id),
        project_id=str(issue.project_id),
        type=issue.type.value,
        key=issue.key,
        title=issue.title,
        description=issue.description,
        status=schemas.StatusBrief(
            id=str(issue.status.id),
            name=issue.status.name,
            category=issue.status.category.value,
        ),
        priority=issue.priority.value,
        assignee=schemas.UserBrief(
            id=str(issue.assignee.id),
            name=issue.assignee.name,
            email=issue.assignee.email,
            avatar_url=issue.assignee.avatar_url,
        ) if issue.assignee else None,
        reporter=schemas.UserBrief(
            id=str(issue.reporter.id),
            name=issue.reporter.name,
            email=issue.reporter.email,
            avatar_url=issue.reporter.avatar_url,
        ),
        sprint=schemas.SprintBrief(
            id=str(issue.sprint.id),
            name=issue.sprint.name,
        ) if issue.sprint else None,
        parent=schemas.IssueBrief(
            id=str(issue.parent.id),
            key=issue.parent.key,
            title=issue.parent.title,
            type=issue.parent.type.value,
            priority=issue.parent.priority.value,
        ) if issue.parent else None,
        children=[
            schemas.IssueBrief(
                id=str(c.id),
                key=c.key,
                title=c.title,
                type=c.type.value,
                priority=c.priority.value,
            )
            for c in children
        ],
        labels=[
            schemas.LabelBrief(id=str(l.id), name=l.name, color=l.color)
            for l in issue.labels
        ],
        story_points=issue.story_points,
        due_date=issue.due_date,
        position=issue.position,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
    )


def _to_list_item(issue: Issue) -> schemas.IssueListItem:
    return schemas.IssueListItem(
        id=str(issue.id),
        project_id=str(issue.project_id),
        type=issue.type.value,
        key=issue.key,
        title=issue.title,
        status=schemas.StatusBrief(
            id=str(issue.status.id),
            name=issue.status.name,
            category=issue.status.category.value,
        ),
        priority=issue.priority.value,
        assignee=schemas.UserBrief(
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


@router.post("", response_model=schemas.IssueResponse, status_code=201)
async def create_issue(
    project_id: UUID,
    data: schemas.IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify user is project member
    await project_service.get_project(db, project_id, current_user)
    issue = await service.create_issue(db, project_id, data, current_user)
    children = await service.get_children(db, issue.id)
    return _to_response(issue, children)


@router.get("", response_model=schemas.IssueListResponse)
async def list_issues(
    project_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    type: str | None = Query(None),
    status_id: UUID | None = Query(None),
    priority: str | None = Query(None),
    assignee_id: UUID | None = Query(None),
    sprint_id: UUID | None = Query(None),
    label_id: UUID | None = Query(None),
    search: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.get_project(db, project_id, current_user)
    issues, total = await service.get_issues(
        db, project_id, page, size, type, status_id, priority, assignee_id, sprint_id, label_id, search
    )
    return schemas.IssueListResponse(
        items=[_to_list_item(i) for i in issues],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{issue_id}", response_model=schemas.IssueResponse)
async def get_issue(
    project_id: UUID,
    issue_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.get_project(db, project_id, current_user)
    issue = await service.get_issue(db, project_id, issue_id)
    children = await service.get_children(db, issue.id)
    return _to_response(issue, children)


@router.patch("/{issue_id}", response_model=schemas.IssueResponse)
async def update_issue(
    project_id: UUID,
    issue_id: UUID,
    data: schemas.IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.get_project(db, project_id, current_user)
    role = await project_service.get_user_role_in_project(db, project_id, current_user.id)
    if ROLE_HIERARCHY.get(role, 0) < ROLE_HIERARCHY["developer"]:
        raise HTTPException(403, "Viewers cannot edit issues")
    issue = await service.get_issue(db, project_id, issue_id)
    updated = await service.update_issue(db, issue, data, current_user)
    children = await service.get_children(db, updated.id)
    return _to_response(updated, children)


@router.delete("/{issue_id}", status_code=204)
async def delete_issue(
    project_id: UUID,
    issue_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.get_project(db, project_id, current_user)
    role = await project_service.get_user_role_in_project(db, project_id, current_user.id)
    if ROLE_HIERARCHY.get(role, 0) < ROLE_HIERARCHY["project_manager"]:
        raise HTTPException(403, "Only admins and PMs can delete issues")
    issue = await service.get_issue(db, project_id, issue_id)
    await service.delete_issue(db, issue)
