"""Issue business logic."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, delete, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.issues.models import Issue, IssueType, IssueLabel
from app.issues.schemas import IssueCreate, IssueUpdate
from app.projects.models import Project, WorkflowStatus, Label

# Hierarchy rules: what types can be parents of what
VALID_PARENTS = {
    IssueType.story: [IssueType.epic],
    IssueType.task: [IssueType.epic],
    IssueType.bug: [IssueType.epic],
    IssueType.subtask: [IssueType.story, IssueType.task],
    IssueType.epic: [],  # Epics have no parent
}


async def _get_default_status(db: AsyncSession, project_id: UUID) -> WorkflowStatus:
    """Returns the first 'todo' status of the project."""
    result = await db.execute(
        select(WorkflowStatus)
        .where(
            WorkflowStatus.project_id == project_id,
            WorkflowStatus.category == "todo",
        )
        .order_by(WorkflowStatus.position.asc())
        .limit(1)
    )
    status = result.scalar_one_or_none()
    if not status:
        raise HTTPException(500, "Project has no 'todo' workflow status")
    return status


async def _generate_key(db: AsyncSession, project_id: UUID) -> str:
    """Atomically increment issue_counter and return the new key."""
    result = await db.execute(
        update(Project)
        .where(Project.id == project_id)
        .values(issue_counter=Project.issue_counter + 1)
        .returning(Project.issue_counter, Project.key)
    )
    row = result.one()
    return f"{row.key}-{row.issue_counter}"


async def _validate_hierarchy(db: AsyncSession, issue_type: IssueType, parent_id: UUID | None) -> None:
    """Validate parent-child type constraints."""
    if issue_type == IssueType.epic:
        if parent_id is not None:
            raise HTTPException(422, "Epics cannot have a parent issue")
        return

    allowed_parent_types = VALID_PARENTS.get(issue_type, [])
    if not allowed_parent_types and parent_id is not None:
        raise HTTPException(422, f"{issue_type.value} cannot have a parent")

    if parent_id is not None:
        parent = await db.get(Issue, parent_id)
        if not parent:
            raise HTTPException(404, "Parent issue not found")
        if parent.type not in allowed_parent_types:
            allowed_names = [t.value for t in allowed_parent_types]
            raise HTTPException(
                422,
                f"{issue_type.value} parent must be one of: {', '.join(allowed_names)}"
            )


async def create_issue(db: AsyncSession, project_id: UUID, data: IssueCreate, reporter: User) -> Issue:
    """Create a new issue with atomic key generation."""
    # Validate hierarchy
    await _validate_hierarchy(db, data.type, data.parent_id)

    # Get or assign status
    if data.status_id:
        status = await db.get(WorkflowStatus, data.status_id)
        if not status or status.project_id != project_id:
            raise HTTPException(404, "Status not found in this project")
    else:
        status = await _get_default_status(db, project_id)

    # Validate assignee is project member (optional check)
    # Validate sprint belongs to project (optional check)

    # Generate atomic key
    key = await _generate_key(db, project_id)

    issue = Issue(
        project_id=project_id,
        type=data.type,
        key=key,
        title=data.title,
        description=data.description,
        status_id=status.id,
        priority=data.priority,
        assignee_id=data.assignee_id,
        reporter_id=reporter.id,
        sprint_id=data.sprint_id,
        parent_id=data.parent_id,
        story_points=data.story_points,
        due_date=data.due_date,
        position=0,
    )
    db.add(issue)
    await db.flush()  # get issue.id

    # Add labels (many-to-many)
    if data.label_ids:
        for label_id in data.label_ids:
            label = await db.get(Label, label_id)
            if label and label.project_id == project_id:
                issue_label = IssueLabel(issue_id=issue.id, label_id=label_id)
                db.add(issue_label)

    await db.commit()
    await db.refresh(issue)
    return issue


async def get_issues(
    db: AsyncSession,
    project_id: UUID,
    page: int = 1,
    size: int = 50,
    type: str | None = None,
    status_id: UUID | None = None,
    priority: str | None = None,
    assignee_id: UUID | None = None,
    sprint_id: UUID | None = None,
    label_id: UUID | None = None,
    search: str | None = None,
) -> tuple[list[Issue], int]:
    """List issues for a project with optional filters and search."""
    filters = [Issue.project_id == project_id]
    if type:
        filters.append(Issue.type == type)
    if status_id:
        filters.append(Issue.status_id == status_id)
    if priority:
        filters.append(Issue.priority == priority)
    if assignee_id:
        filters.append(Issue.assignee_id == assignee_id)
    if sprint_id:
        filters.append(Issue.sprint_id == sprint_id)

    # Text search on title and key
    if search:
        search_pattern = f"%{search}%"
        filters.append(
            (Issue.title.ilike(search_pattern)) | (Issue.key.ilike(search_pattern))
        )

    q = select(Issue).where(and_(*filters))

    # Join for label filtering if needed
    if label_id:
        q = q.join(IssueLabel).where(IssueLabel.label_id == label_id)

    count_q = select(func.count(Issue.id)).where(and_(*filters))
    if label_id:
        count_q = count_q.select_from(Issue).join(IssueLabel).where(IssueLabel.label_id == label_id)
    total = await db.scalar(count_q) or 0

    q = (
        q
        .order_by(Issue.position.asc(), Issue.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .distinct()
    )
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def get_issue(db: AsyncSession, project_id: UUID, issue_id: UUID) -> Issue:
    issue = await db.get(Issue, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(404, "Issue not found")
    return issue


async def get_issue_by_key(db: AsyncSession, project_id: UUID, key: str) -> Issue:
    result = await db.execute(
        select(Issue).where(Issue.project_id == project_id, Issue.key == key)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(404, "Issue not found")
    return issue


async def get_children(db: AsyncSession, issue_id: UUID) -> list[Issue]:
    result = await db.execute(
        select(Issue)
        .where(Issue.parent_id == issue_id)
        .order_by(Issue.position.asc())
    )
    return list(result.scalars().all())


async def update_issue(
    db: AsyncSession, issue: Issue, data: IssueUpdate, user: User
) -> Issue:
    """Update issue fields."""
    if data.title is not None:
        issue.title = data.title
    if data.description is not None:
        issue.description = data.description
    if data.priority is not None:
        issue.priority = data.priority
    if data.status_id is not None:
        issue.status_id = data.status_id
    if data.assignee_id is not None:
        issue.assignee_id = data.assignee_id
    if data.sprint_id is not None:
        issue.sprint_id = data.sprint_id
    if data.story_points is not None:
        issue.story_points = data.story_points
    if data.due_date is not None:
        issue.due_date = data.due_date
    if data.parent_id is not None:
        if data.type or issue.type:
            await _validate_hierarchy(db, data.type or issue.type, data.parent_id)
        issue.parent_id = data.parent_id

    # Update labels if provided
    if data.label_ids is not None:
        # Remove existing labels
        await db.execute(
            delete(IssueLabel).where(IssueLabel.issue_id == issue.id)
        )
        # Add new labels
        for label_id in data.label_ids:
            db.add(IssueLabel(issue_id=issue.id, label_id=label_id))

    issue.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(issue)
    return issue


async def delete_issue(db: AsyncSession, issue: Issue) -> None:
    """Delete issue and its subtasks (cascade handles children via FK)."""
    await db.delete(issue)
    await db.commit()
