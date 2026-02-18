"""Comment business logic."""

from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.comments.models import Comment
from app.comments.schemas import CommentCreate, CommentUpdate
from app.issues.models import Issue
from app.notifications.schemas import NotificationCreate
from app.notifications.service import create_notification


async def get_comments(db: AsyncSession, issue_id: UUID) -> list[Comment]:
    """Get all comments for an issue, ordered by creation time."""
    result = await db.execute(
        select(Comment)
        .where(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
    )
    return list(result.scalars().all())


async def create_comment(
    db: AsyncSession,
    issue_id: UUID,
    data: CommentCreate,
    author: User,
) -> Comment:
    """Create a new comment on an issue.

    Validates that the issue exists before creating the comment.
    Sends notifications to the issue assignee and reporter (if not the author).
    """
    # Verify issue exists
    issue = await db.get(Issue, issue_id)
    if not issue:
        raise HTTPException(404, "Issue not found")

    comment = Comment(
        issue_id=issue_id,
        author_id=author.id,
        content=data.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    # Notify issue assignee and reporter (unless they are the author)
    # Assignee notification
    if issue.assignee_id and str(issue.assignee_id) != str(author.id):
        await create_notification(
            db,
            NotificationCreate(
                user_id=issue.assignee_id,
                issue_id=issue.id,
                type="commented",
                title=f"New comment on {issue.key}",
                body=f"{author.name}: {data.content[:100]}..." if len(data.content) > 100 else f"{author.name}: {data.content}",
            ),
        )

    # Reporter notification (only if assignee is different)
    if issue.reporter_id and str(issue.reporter_id) != str(author.id) and issue.reporter_id != issue.assignee_id:
        await create_notification(
            db,
            NotificationCreate(
                user_id=issue.reporter_id,
                issue_id=issue.id,
                type="commented",
                title=f"New comment on {issue.key}",
                body=f"{author.name}: {data.content[:100]}..." if len(data.content) > 100 else f"{author.name}: {data.content}",
            ),
        )

    return comment


async def update_comment(
    db: AsyncSession,
    comment: Comment,
    data: CommentUpdate,
    user: User,
) -> Comment:
    """Update a comment.

    Only the author or a system admin can update a comment.
    """
    if comment.author_id != user.id and user.role.value != "admin":
        raise HTTPException(403, "You can only edit your own comments")

    comment.content = data.content
    await db.commit()
    await db.refresh(comment)
    return comment


async def delete_comment(
    db: AsyncSession,
    comment: Comment,
    user: User,
) -> None:
    """Delete a comment.

    Only the author or a system admin can delete a comment.
    """
    if comment.author_id != user.id and user.role.value != "admin":
        raise HTTPException(403, "You can only delete your own comments")

    await db.delete(comment)
    await db.commit()


async def get_comment(db: AsyncSession, comment_id: UUID) -> Comment | None:
    """Get a comment by ID."""
    return await db.get(Comment, comment_id)
