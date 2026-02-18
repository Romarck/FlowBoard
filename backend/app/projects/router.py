"""Projects API router."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.common.permissions import ROLE_HIERARCHY
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


def _member_to_response(member) -> schemas.MemberResponse:
    """Convert a ProjectMember to MemberResponse."""
    return schemas.MemberResponse(
        user_id=str(member.user_id),
        name=member.user.name,
        email=member.user.email,
        avatar_url=member.user.avatar_url,
        role=member.role,
        joined_at=member.joined_at,
    )


@router.get("/{project_id}/members", response_model=list[schemas.MemberResponse])
async def list_members(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a project."""
    project = await service.get_project(db, project_id, current_user)
    members = await service.get_members(db, project_id)
    return [_member_to_response(m) for m in members]


@router.post("/{project_id}/members", response_model=schemas.MemberResponse, status_code=201)
async def add_member(
    project_id: UUID,
    data: schemas.MemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to a project by email."""
    project = await service.get_project(db, project_id, current_user)
    # Check requester is admin or PM
    requester_role = await service.get_user_role_in_project(
        db, project_id, current_user.id
    )
    if ROLE_HIERARCHY.get(requester_role, 0) < ROLE_HIERARCHY["project_manager"]:
        raise HTTPException(
            403, "Only admins and project managers can add members"
        )
    member = await service.add_member(db, project, data.email, data.role, current_user)
    return _member_to_response(member)


@router.patch("/{project_id}/members/{user_id}", response_model=schemas.MemberResponse)
async def update_member(
    project_id: UUID,
    user_id: UUID,
    data: schemas.MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role. Only admins can change roles."""
    project = await service.get_project(db, project_id, current_user)
    requester_role = await service.get_user_role_in_project(
        db, project_id, current_user.id
    )
    if requester_role != "admin":
        raise HTTPException(403, "Only admins can change member roles")
    member = await service.update_member_role(db, project, user_id, data.role, current_user)
    return _member_to_response(member)


@router.delete("/{project_id}/members/{user_id}", status_code=204)
async def remove_member(
    project_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from a project. Only admins can remove members."""
    project = await service.get_project(db, project_id, current_user)
    requester_role = await service.get_user_role_in_project(
        db, project_id, current_user.id
    )
    if requester_role != "admin":
        raise HTTPException(403, "Only admins can remove members")
    await service.remove_member(db, project, user_id, current_user)


# ── Workflow Statuses ──────────────────────────────────────────────────────


@router.get("/{project_id}/statuses", response_model=list[schemas.StatusResponse])
async def list_statuses(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all workflow statuses for a project."""
    # Verify user is member
    await service.get_project(db, project_id, current_user)
    statuses = await service.get_statuses(db, project_id)
    return [
        schemas.StatusResponse(
            id=str(s.id),
            name=s.name,
            category=s.category.value,
            position=s.position,
            wip_limit=s.wip_limit,
        )
        for s in statuses
    ]


# ── Labels ─────────────────────────────────────────────────────────────────


@router.get("/{project_id}/labels", response_model=list[schemas.LabelResponse])
async def list_labels(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all labels for a project."""
    await service.get_project(db, project_id, current_user)
    labels = await service.get_labels(db, project_id)
    return [
        schemas.LabelResponse(id=str(l.id), name=l.name, color=l.color) for l in labels
    ]


@router.post("/{project_id}/labels", response_model=schemas.LabelResponse, status_code=201)
async def create_label(
    project_id: UUID,
    data: schemas.LabelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new label in the project."""
    await service.get_project(db, project_id, current_user)
    label = await service.create_label(db, project_id, data)
    return schemas.LabelResponse(id=str(label.id), name=label.name, color=label.color)


@router.patch("/{project_id}/labels/{label_id}", response_model=schemas.LabelResponse)
async def update_label(
    project_id: UUID,
    label_id: UUID,
    data: schemas.LabelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a label. Only admins and project managers can edit labels."""
    await service.get_project(db, project_id, current_user)
    role = await service.get_user_role_in_project(db, project_id, current_user.id)
    if ROLE_HIERARCHY.get(role, 0) < ROLE_HIERARCHY["project_manager"]:
        raise HTTPException(403, "Only admins and project managers can edit labels")
    label = await service.update_label(db, project_id, label_id, data)
    return schemas.LabelResponse(id=str(label.id), name=label.name, color=label.color)


@router.delete("/{project_id}/labels/{label_id}", status_code=204)
async def delete_label(
    project_id: UUID,
    label_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a label. Only admins and project managers can delete labels."""
    await service.get_project(db, project_id, current_user)
    role = await service.get_user_role_in_project(db, project_id, current_user.id)
    if ROLE_HIERARCHY.get(role, 0) < ROLE_HIERARCHY["project_manager"]:
        raise HTTPException(403, "Only admins and project managers can delete labels")
    await service.delete_label(db, project_id, label_id)
