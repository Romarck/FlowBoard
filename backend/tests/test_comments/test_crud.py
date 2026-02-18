"""Tests for comments CRUD operations."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.models import User, UserRole
from app.auth.utils import hash_password
from app.comments import schemas, service
from app.comments.models import Comment


def _make_user(
    user_id: str | None = None,
    email: str = "test@example.com",
    name: str = "Test User",
    role: UserRole = UserRole.developer,
) -> MagicMock:
    """Create a mock user."""
    user = MagicMock(spec=User)
    user.id = uuid.UUID(user_id) if user_id else uuid.uuid4()
    user.email = email
    user.name = name
    user.role = MagicMock()
    user.role.value = role.value
    return user


def _make_comment(
    comment_id: str | None = None,
    issue_id: str | None = None,
    author: MagicMock | None = None,
    content: str = "Test comment",
) -> MagicMock:
    """Create a mock comment."""
    comment = MagicMock(spec=Comment)
    comment.id = uuid.UUID(comment_id) if comment_id else uuid.uuid4()
    comment.issue_id = uuid.UUID(issue_id) if issue_id else uuid.uuid4()
    comment.author_id = author.id if author else uuid.uuid4()
    comment.author = author or _make_user()
    comment.content = content
    comment.created_at = datetime.now(timezone.utc)
    comment.updated_at = datetime.now(timezone.utc)
    return comment


@pytest.mark.asyncio
async def test_create_comment_success():
    """Test creating a comment on an issue."""
    # Setup
    db = AsyncMock()
    issue_id = uuid.uuid4()
    author = _make_user()

    # Mock the issue lookup
    mock_issue = MagicMock()
    mock_issue.id = issue_id
    db.get = AsyncMock(return_value=mock_issue)

    # Mock the comment save
    created_comment = _make_comment(issue_id=str(issue_id), author=author)
    db.refresh = AsyncMock(side_effect=lambda obj: None)
    db.commit = AsyncMock()

    # Act
    data = schemas.CommentCreate(content="Test comment")
    db.add = MagicMock()

    # Simulate what the service does
    comment = Comment(
        issue_id=issue_id,
        author_id=author.id,
        content=data.content,
    )
    db.add(comment)

    result = await service.create_comment(db, issue_id, data, author)

    # Assert
    assert result is not None
    db.get.assert_called_once_with(Comment.__class__ if hasattr(Comment, '__class__') else Comment, issue_id)
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_comment_issue_not_found():
    """Test creating a comment on a non-existent issue."""
    # Setup
    db = AsyncMock()
    issue_id = uuid.uuid4()
    author = _make_user()

    # Mock the issue lookup to return None
    db.get = AsyncMock(return_value=None)

    # Act & Assert
    data = schemas.CommentCreate(content="Test comment")
    with pytest.raises(Exception) as exc_info:
        await service.create_comment(db, issue_id, data, author)

    assert "404" in str(exc_info.value) or "not found" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_get_comments():
    """Test getting all comments for an issue."""
    # Setup
    db = AsyncMock()
    issue_id = uuid.uuid4()
    author1 = _make_user(user_id=str(uuid.uuid4()), email="user1@example.com")
    author2 = _make_user(user_id=str(uuid.uuid4()), email="user2@example.com")

    comments = [
        _make_comment(issue_id=str(issue_id), author=author1, content="First comment"),
        _make_comment(issue_id=str(issue_id), author=author2, content="Second comment"),
    ]

    # Mock the database query
    mock_result = AsyncMock()
    mock_result.scalars.return_value.all.return_value = comments
    db.execute = AsyncMock(return_value=mock_result)

    # Act
    result = await service.get_comments(db, issue_id)

    # Assert
    assert len(result) == 2
    assert result[0].content == "First comment"
    assert result[1].content == "Second comment"
    db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_update_comment_by_author():
    """Test updating a comment by the author."""
    # Setup
    db = AsyncMock()
    author = _make_user()
    comment = _make_comment(author=author, content="Original content")

    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    # Act
    update_data = schemas.CommentUpdate(content="Updated content")
    result = await service.update_comment(db, comment, update_data, author)

    # Assert
    assert result.content == "Updated content"
    db.commit.assert_called_once()
    db.refresh.assert_called_once()


@pytest.mark.asyncio
async def test_update_comment_by_other_user_fails():
    """Test that other users cannot update a comment."""
    # Setup
    db = AsyncMock()
    author = _make_user(user_id=str(uuid.uuid4()), email="author@example.com")
    other_user = _make_user(user_id=str(uuid.uuid4()), email="other@example.com")
    comment = _make_comment(author=author)

    # Act & Assert
    update_data = schemas.CommentUpdate(content="Updated content")
    with pytest.raises(Exception) as exc_info:
        await service.update_comment(db, comment, update_data, other_user)

    assert "403" in str(exc_info.value) or "can only edit" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_delete_comment():
    """Test deleting a comment."""
    # Setup
    db = AsyncMock()
    author = _make_user()
    comment = _make_comment(author=author)

    db.delete = AsyncMock()
    db.commit = AsyncMock()

    # Act
    await service.delete_comment(db, comment, author)

    # Assert
    db.delete.assert_called_once_with(comment)
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_comment_by_other_user_fails():
    """Test that other users cannot delete a comment."""
    # Setup
    db = AsyncMock()
    author = _make_user(user_id=str(uuid.uuid4()), email="author@example.com")
    other_user = _make_user(user_id=str(uuid.uuid4()), email="other@example.com")
    comment = _make_comment(author=author)

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        await service.delete_comment(db, comment, other_user)

    assert "403" in str(exc_info.value) or "can only delete" in str(exc_info.value).lower()
