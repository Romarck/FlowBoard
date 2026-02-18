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
from app.projects.models import Project, ProjectMember, WorkflowStatus, StatusCategory, Label
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


async def get_statuses(db: AsyncSession, project_id: UUID) -> list[WorkflowStatus]:
    """Get all workflow statuses for a project, ordered by position."""
    result = await db.execute(
        select(WorkflowStatus)
        .where(WorkflowStatus.project_id == project_id)
        .order_by(WorkflowStatus.position.asc())
    )
    return list(result.scalars().all())


async def get_labels(db: AsyncSession, project_id: UUID) -> list[Label]:
    """Get all labels for a project, ordered by name."""
    result = await db.execute(
        select(Label)
        .where(Label.project_id == project_id)
        .order_by(Label.name.asc())
    )
    return list(result.scalars().all())


async def create_label(db: AsyncSession, project_id: UUID, data: "schemas.LabelCreate") -> Label:
    """Create a new label in the project."""
    from app.projects import schemas

    label = Label(
        project_id=project_id,
        name=data.name,
        color=data.color,
    )
    db.add(label)
    try:
        await db.commit()
        await db.refresh(label)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "A label with this name already exists in the project")
    return label


async def update_label(
    db: AsyncSession, project_id: UUID, label_id: UUID, data: "schemas.LabelUpdate"
) -> Label:
    """Update a label."""
    from app.projects import schemas

    label = await db.get(Label, label_id)
    if not label or label.project_id != project_id:
        raise HTTPException(404, "Label not found")

    if data.name is not None:
        label.name = data.name
    if data.color is not None:
        label.color = data.color

    try:
        await db.commit()
        await db.refresh(label)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "A label with this name already exists in the project")
    return label


async def delete_label(db: AsyncSession, project_id: UUID, label_id: UUID) -> None:
    """Delete a label."""
    label = await db.get(Label, label_id)
    if not label or label.project_id != project_id:
        raise HTTPException(404, "Label not found")
    await db.delete(label)
    await db.commit()


# ── Metrics ────────────────────────────────────────────────────────────────


async def get_project_metrics(db: AsyncSession, project_id: UUID, user: AuthUser) -> dict:
    """Get comprehensive metrics for a project."""
    from datetime import date
    from app.issues.models import Issue
    from app.sprints.models import Sprint, SprintStatus

    # Verify user is member
    await get_project(db, project_id, user)

    # Total issues
    total = await db.scalar(
        select(func.count(Issue.id)).where(Issue.project_id == project_id)
    ) or 0

    # Open issues (not done)
    open_issues = await db.scalar(
        select(func.count(Issue.id))
        .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
        .where(
            Issue.project_id == project_id,
            WorkflowStatus.category != StatusCategory.done,
        )
    ) or 0

    # Completed issues (status.category == 'done')
    completed = await db.scalar(
        select(func.count(Issue.id))
        .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
        .where(
            Issue.project_id == project_id,
            WorkflowStatus.category == StatusCategory.done,
        )
    ) or 0

    # Overdue issues (due_date < today AND not done)
    overdue = await db.scalar(
        select(func.count(Issue.id))
        .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
        .where(
            Issue.project_id == project_id,
            Issue.due_date < date.today(),
            WorkflowStatus.category != StatusCategory.done,
        )
    ) or 0

    # Issues by status
    status_rows = await db.execute(
        select(
            WorkflowStatus.name,
            WorkflowStatus.category,
            func.count(Issue.id),
        )
        .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
        .where(Issue.project_id == project_id)
        .group_by(WorkflowStatus.name, WorkflowStatus.category)
    )
    by_status = [
        {"status_name": row[0], "category": row[1].value, "count": row[2]}
        for row in status_rows
    ]

    # Issues by priority
    priority_rows = await db.execute(
        select(Issue.priority, func.count(Issue.id))
        .where(Issue.project_id == project_id)
        .group_by(Issue.priority)
    )
    by_priority = [
        {"priority": row[0].value, "count": row[1]} for row in priority_rows
    ]

    # Issues by type
    type_rows = await db.execute(
        select(Issue.type, func.count(Issue.id))
        .where(Issue.project_id == project_id)
        .group_by(Issue.type)
    )
    by_type = [{"type": row[0].value, "count": row[1]} for row in type_rows]

    # Active sprint
    active_sprint = None
    active_sprint_row = await db.execute(
        select(Sprint)
        .where(
            Sprint.project_id == project_id,
            Sprint.status == SprintStatus.active,
        )
        .limit(1)
    )
    active_sprint_obj = active_sprint_row.scalar_one_or_none()
    if active_sprint_obj:
        total_points = await db.scalar(
            select(func.coalesce(func.sum(Issue.story_points), 0))
            .where(Issue.sprint_id == active_sprint_obj.id)
        ) or 0
        completed_points = await db.scalar(
            select(func.coalesce(func.sum(Issue.story_points), 0))
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.sprint_id == active_sprint_obj.id,
                WorkflowStatus.category == StatusCategory.done,
            )
        ) or 0
        issue_count = await db.scalar(
            select(func.count(Issue.id)).where(
                Issue.sprint_id == active_sprint_obj.id
            )
        ) or 0
        completed_count = await db.scalar(
            select(func.count(Issue.id))
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.sprint_id == active_sprint_obj.id,
                WorkflowStatus.category == StatusCategory.done,
            )
        ) or 0
        active_sprint = {
            "id": str(active_sprint_obj.id),
            "name": active_sprint_obj.name,
            "planned_points": total_points,
            "completed_points": completed_points,
            "issue_count": issue_count,
            "completed_count": completed_count,
        }

    # Recent sprints (last 5 completed)
    recent_sprints = []
    recent_rows = await db.execute(
        select(Sprint)
        .where(
            Sprint.project_id == project_id,
            Sprint.status == SprintStatus.completed,
        )
        .order_by(Sprint.end_date.desc())
        .limit(5)
    )
    for sprint_obj in recent_rows.scalars().all():
        total_points = await db.scalar(
            select(func.coalesce(func.sum(Issue.story_points), 0))
            .where(Issue.sprint_id == sprint_obj.id)
        ) or 0
        completed_points = await db.scalar(
            select(func.coalesce(func.sum(Issue.story_points), 0))
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.sprint_id == sprint_obj.id,
                WorkflowStatus.category == StatusCategory.done,
            )
        ) or 0
        issue_count = await db.scalar(
            select(func.count(Issue.id)).where(Issue.sprint_id == sprint_obj.id)
        ) or 0
        completed_count = await db.scalar(
            select(func.count(Issue.id))
            .join(WorkflowStatus, Issue.status_id == WorkflowStatus.id)
            .where(
                Issue.sprint_id == sprint_obj.id,
                WorkflowStatus.category == StatusCategory.done,
            )
        ) or 0
        recent_sprints.append(
            {
                "id": str(sprint_obj.id),
                "name": sprint_obj.name,
                "planned_points": total_points,
                "completed_points": completed_points,
                "issue_count": issue_count,
                "completed_count": completed_count,
            }
        )

    # Issues by member
    member_rows = await db.execute(
        select(
            AuthUser.id,
            AuthUser.name,
            AuthUser.avatar_url,
            func.count(Issue.id),
        )
        .outerjoin(Issue, (Issue.assignee_id == AuthUser.id) & (Issue.project_id == project_id))
        .group_by(AuthUser.id, AuthUser.name, AuthUser.avatar_url)
        .order_by(func.count(Issue.id).desc())
    )
    issues_by_member = [
        {
            "member_id": str(row[0]),
            "name": row[1],
            "avatar_url": row[2],
            "open_count": row[3],
        }
        for row in member_rows
        if row[3] > 0  # Only show members with assigned issues
    ]

    return {
        "total_issues": total,
        "open_issues": open_issues,
        "completed_issues": completed,
        "overdue_issues": overdue,
        "by_status": by_status,
        "by_priority": by_priority,
        "by_type": by_type,
        "active_sprint": active_sprint,
        "recent_sprints": recent_sprints,
        "issues_by_member": issues_by_member,
    }
