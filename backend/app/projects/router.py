"""Projects API router."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.projects import schemas, service
from app.projects.models import Project

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


def _to_response(project: Project) -> schemas.ProjectResponse:
    return schemas.ProjectResponse(
        id=str(project.id),
        name=project.name,
        key=project.key,
        description=project.description,
        methodology=project.methodology.value,
        owner_id=str(project.owner_id),
        issue_counter=project.issue_counter,
        member_count=len(project.members),
        created_at=project.created_at,
        updated_at=project.updated_at,
        workflow_statuses=[
            schemas.WorkflowStatusResponse(
                id=str(ws.id),
                name=ws.name,
                category=ws.category.value,
                position=ws.position,
                wip_limit=ws.wip_limit,
            )
            for ws in sorted(project.workflow_statuses, key=lambda x: x.position)
        ],
    )


def _to_list_item(project: Project) -> schemas.ProjectListItem:
    return schemas.ProjectListItem(
        id=str(project.id),
        name=project.name,
        key=project.key,
        description=project.description,
        methodology=project.methodology.value,
        member_count=len(project.members),
        created_at=project.created_at,
    )


@router.post("", response_model=schemas.ProjectResponse, status_code=201)
async def create_project(
    data: schemas.ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await service.create_project(db, data, current_user)
    return _to_response(project)


@router.get("", response_model=schemas.ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    projects, total = await service.get_projects(db, current_user, page, size)
    return schemas.ProjectListResponse(
        items=[_to_list_item(p) for p in projects],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{project_id}", response_model=schemas.ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await service.get_project(db, project_id, current_user)
    return _to_response(project)


@router.patch("/{project_id}", response_model=schemas.ProjectResponse)
async def update_project(
    project_id: UUID,
    data: schemas.ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await service.get_project(db, project_id, current_user)
    updated = await service.update_project(db, project, data, current_user)
    return _to_response(updated)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await service.get_project(db, project_id, current_user)
    await service.delete_project(db, project, current_user)
