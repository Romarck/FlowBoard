"""Tests for attachment upload functionality."""

import io
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.attachments.models import Attachment
from app.attachments.service import upload_attachment
from app.config import settings


@pytest.fixture
def test_issue_id():
    """Test issue ID."""
    return uuid.uuid4()


@pytest.fixture
def test_user():
    """Create a test user."""
    user = MagicMock()
    user.id = uuid.uuid4()
    user.name = "Test User"
    user.avatar_url = None
    return user


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = AsyncMock()
    return db


@pytest.mark.asyncio
async def test_upload_image_success(mock_db, test_issue_id, test_user, tmp_path):
    """Test successful image upload."""
    # Create a test image file
    image_content = b"fake_image_data"
    file = MagicMock()
    file.filename = "test.png"
    file.content_type = "image/png"
    file.read = AsyncMock(side_effect=[image_content, b""])

    # Mock attachment creation
    attachment = MagicMock(spec=Attachment)
    attachment.id = uuid.uuid4()
    attachment.issue_id = test_issue_id
    attachment.filename = file.filename
    attachment.size = len(image_content)
    attachment.mime_type = file.content_type
    attachment.filepath = f"{test_issue_id}/abc123_test.png"
    attachment.created_at = MagicMock()
    attachment.uploader = test_user

    mock_db.commit = AsyncMock()
    mock_db.add = MagicMock()

    from datetime import datetime, timezone

    async def refresh_attachment(obj):
        """Simulate DB refresh: set id, created_at and uploader."""
        obj.id = uuid.uuid4()
        obj.created_at = datetime.now(timezone.utc)
        obj.uploader = test_user

    mock_db.refresh = AsyncMock(side_effect=refresh_attachment)

    with patch("app.attachments.service.Path") as mock_path:
        mock_path_instance = MagicMock()
        mock_path.return_value = mock_path_instance
        mock_path_instance.parent.mkdir = MagicMock()
        mock_path_instance.exists.return_value = False

        with patch("builtins.open", create=True) as mock_open:
            mock_open.return_value.__enter__.return_value.write = MagicMock()

            result = await upload_attachment(mock_db, test_issue_id, file, test_user)

            # Verify file was saved
            mock_open.assert_called()

            # Verify attachment was added to DB
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called_once()
            mock_db.refresh.assert_called_once()


@pytest.mark.asyncio
async def test_upload_too_large_fails(mock_db, test_issue_id, test_user):
    """Test that uploading a file larger than max size fails."""
    chunk_size = 1024 * 64  # 64KB chunks
    # Build enough chunks to exceed MAX_FILE_SIZE
    num_chunks = (settings.MAX_FILE_SIZE // chunk_size) + 2
    chunks = [b"x" * chunk_size for _ in range(num_chunks)]
    file = MagicMock()
    file.filename = "large.png"
    file.content_type = "image/png"
    file.read = AsyncMock(side_effect=chunks)

    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await upload_attachment(mock_db, test_issue_id, file, test_user)

    assert exc_info.value.status_code == 413


@pytest.mark.asyncio
async def test_upload_invalid_mime_type_fails(mock_db, test_issue_id, test_user):
    """Test that uploading a disallowed file type fails."""
    file = MagicMock()
    file.filename = "malicious.exe"
    file.content_type = "application/x-msdownload"
    file.read = AsyncMock(return_value=b"fake_exe_data")

    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        await upload_attachment(mock_db, test_issue_id, file, test_user)

    assert exc_info.value.status_code == 400
    assert "not allowed" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_delete_attachment_success(mock_db, test_user):
    """Test successful attachment deletion."""
    from app.attachments.service import delete_attachment

    attachment = MagicMock(spec=Attachment)
    attachment.id = uuid.uuid4()
    attachment.filename = "test.png"
    attachment.filepath = "test_path/test.png"
    attachment.uploader_id = test_user.id

    mock_db.get = AsyncMock(return_value=attachment)
    mock_db.delete = AsyncMock()
    mock_db.commit = AsyncMock()

    with patch("os.remove") as mock_remove:
        with patch("app.attachments.service.Path") as mock_path:
            mock_path_instance = MagicMock()
            mock_path.return_value = mock_path_instance
            mock_path_instance.exists.return_value = True

            await delete_attachment(mock_db, attachment.id, test_user)

            mock_db.delete.assert_called_once()
            mock_db.commit.assert_called_once()
