"""Attachment business logic."""

import os
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.attachments.models import Attachment
from app.attachments.schemas import AttachmentResponse, UserInfo
from app.auth.models import User
from app.config import settings

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def _sanitize_filename(filename: str) -> str:
    """Remove path separators and suspicious characters from filename."""
    return "".join(c for c in filename if c.isalnum() or c in "._- ").strip()


async def upload_attachment(
    db: AsyncSession,
    issue_id: UUID,
    file: UploadFile,
    uploader: User,
) -> AttachmentResponse:
    """Upload a file and create attachment record."""
    # Validate MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            400, f"File type {file.content_type} not allowed"
        )

    # Read file in chunks and check size
    contents = b""
    max_size = settings.MAX_FILE_SIZE

    while True:
        chunk = await file.read(1024 * 64)  # 64KB chunks
        if not chunk:
            break
        contents += chunk
        if len(contents) > max_size:
            raise HTTPException(
                413, f"File too large. Maximum size is {max_size / 1024 / 1024:.0f}MB"
            )

    # Sanitize filename and generate safe filepath
    safe_filename = _sanitize_filename(file.filename or "file")
    upload_id = str(uuid.uuid4())[:8]
    filepath = f"{issue_id}/{upload_id}_{safe_filename}"
    full_path = Path(settings.UPLOAD_DIR) / filepath

    # Create directory if it doesn't exist
    full_path.parent.mkdir(parents=True, exist_ok=True)

    # Save file to disk
    with open(full_path, "wb") as f:
        f.write(contents)

    # Create attachment record
    attachment = Attachment(
        issue_id=issue_id,
        uploader_id=uploader.id,
        filename=file.filename or "file",
        filepath=filepath,
        size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)

    # Return response with URL
    return _to_response(attachment)


async def get_attachments(db: AsyncSession, issue_id: UUID) -> list[AttachmentResponse]:
    """Get all attachments for an issue."""
    result = await db.execute(
        select(Attachment)
        .where(Attachment.issue_id == issue_id)
        .order_by(Attachment.created_at.desc())
    )
    attachments = list(result.scalars().all())
    return [_to_response(a) for a in attachments]


async def delete_attachment(
    db: AsyncSession,
    attachment_id: UUID,
    user: User,
) -> None:
    """Delete an attachment. Only uploader or admin can delete."""
    attachment = await db.get(Attachment, attachment_id)
    if not attachment:
        raise HTTPException(404, "Attachment not found")

    # Check permissions: uploader or project admin
    if attachment.uploader_id != user.id:
        raise HTTPException(403, "Only the uploader can delete this attachment")

    # Delete file from disk
    full_path = Path(settings.UPLOAD_DIR) / attachment.filepath
    try:
        if full_path.exists():
            os.remove(full_path)
    except OSError:
        # Log but don't fail if file cleanup fails
        pass

    # Delete database record
    await db.delete(attachment)
    await db.commit()


def _to_response(attachment: Attachment) -> AttachmentResponse:
    """Convert Attachment model to response schema."""
    return AttachmentResponse(
        id=attachment.id,
        issue_id=attachment.issue_id,
        filename=attachment.filename,
        size=attachment.size,
        mime_type=attachment.mime_type,
        url=f"/uploads/{attachment.filepath}",
        created_at=attachment.created_at,
        uploader=UserInfo(
            id=attachment.uploader.id,
            name=attachment.uploader.name,
            avatar_url=attachment.uploader.avatar_url,
        ),
    )
