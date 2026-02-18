"""Attachment API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.attachments.schemas import AttachmentResponse
from app.attachments.service import delete_attachment, get_attachments, upload_attachment
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.projects.service import get_project, get_user_role_in_project

router = APIRouter(prefix="/api/v1/projects", tags=["attachments"])


@router.get("/{project_id}/issues/{issue_id}/attachments", response_model=list[AttachmentResponse])
async def list_attachments(
    project_id: UUID,
    issue_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[AttachmentResponse]:
    """List all attachments for an issue."""
    # Verify user has access to the project
    await get_project(db, project_id, user)

    return await get_attachments(db, issue_id)


@router.post("/{project_id}/issues/{issue_id}/attachments", response_model=AttachmentResponse)
async def create_attachment(
    project_id: UUID,
    issue_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> AttachmentResponse:
    """Upload a file attachment to an issue."""
    # Verify user has access to the project
    await get_project(db, project_id, user)

    return await upload_attachment(db, issue_id, file, user)


@router.delete("/{project_id}/issues/{issue_id}/attachments/{attachment_id}")
async def remove_attachment(
    project_id: UUID,
    issue_id: UUID,
    attachment_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Delete an attachment."""
    # Verify user has access to the project
    await get_project(db, project_id, user)

    await delete_attachment(db, attachment_id, user)
    return {"success": True}
