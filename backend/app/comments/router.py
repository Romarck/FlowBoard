"""Comments API router."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.comments import schemas, service
from app.comments.models import Comment
from app.database import get_db
from app.projects import service as project_service

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/issues/{issue_id}/comments",
    tags=["comments"],
)


@router.get("", response_model=list[schemas.CommentResponse])
async def list_comments(
    project_id: UUID,
    issue_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all comments for an issue."""
    # Verify user is project member
    await project_service.get_project(db, project_id, current_user)

    comments = await service.get_comments(db, issue_id)
    return [
        schemas.CommentResponse(
            id=c.id,
            issue_id=c.issue_id,
            author=schemas.AuthorBrief(
                id=c.author.id,
                name=c.author.name,
                avatar_url=c.author.avatar_url,
            ),
            content=c.content,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in comments
    ]


@router.post("", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    project_id: UUID,
    issue_id: UUID,
    data: schemas.CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new comment on an issue."""
    # Verify user is project member
    await project_service.get_project(db, project_id, current_user)

    comment = await service.create_comment(db, issue_id, data, current_user)
    return schemas.CommentResponse(
        id=comment.id,
        issue_id=comment.issue_id,
        author=schemas.AuthorBrief(
            id=comment.author.id,
            name=comment.author.name,
            avatar_url=comment.author.avatar_url,
        ),
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


@router.patch("/{comment_id}", response_model=schemas.CommentResponse)
async def update_comment(
    project_id: UUID,
    issue_id: UUID,
    comment_id: UUID,
    data: schemas.CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a comment. Only the author or admin can update."""
    # Verify user is project member
    await project_service.get_project(db, project_id, current_user)

    comment = await service.get_comment(db, comment_id)
    if not comment or comment.issue_id != issue_id:
        raise HTTPException(404, "Comment not found")

    updated = await service.update_comment(db, comment, data, current_user)
    return schemas.CommentResponse(
        id=updated.id,
        issue_id=updated.issue_id,
        author=schemas.AuthorBrief(
            id=updated.author.id,
            name=updated.author.name,
            avatar_url=updated.author.avatar_url,
        ),
        content=updated.content,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
    )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    project_id: UUID,
    issue_id: UUID,
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment. Only the author or admin can delete."""
    # Verify user is project member
    await project_service.get_project(db, project_id, current_user)

    comment = await service.get_comment(db, comment_id)
    if not comment or comment.issue_id != issue_id:
        raise HTTPException(404, "Comment not found")

    await service.delete_comment(db, comment, current_user)
