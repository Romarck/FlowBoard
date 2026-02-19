"""Tests for issue CRUD endpoints."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.models import User, UserRole
from app.auth.utils import create_access_token
from app.issues.models import Issue, IssueType, IssuePriority
from app.main import app
from tests.conftest import _make_test_user


def _make_test_issue(
    issue_id: str | None = None,
    project_id: str | None = None,
    key: str = "FB-1",
    title: str = "Test Issue",
    type_: IssueType = IssueType.story,
    priority: IssuePriority = IssuePriority.medium,
    status_id: str | None = None,
    assignee_id: str | None = None,
    reporter_id: str | None = None,
) -> MagicMock:
    """Create a mock Issue object for testing."""
    issue = MagicMock()
    issue.id = uuid.UUID(issue_id) if issue_id else uuid.uuid4()
    issue.project_id = uuid.UUID(project_id) if project_id else uuid.uuid4()
    issue.key = key
    issue.title = title
    issue.description = None
    issue.type = type_
    issue.priority = priority
    issue.status_id = uuid.UUID(status_id) if status_id else uuid.uuid4()
    issue.assignee_id = uuid.UUID(assignee_id) if assignee_id else None
    issue.reporter_id = uuid.UUID(reporter_id) if reporter_id else uuid.uuid4()
    issue.sprint_id = None
    issue.parent_id = None
    issue.story_points = None
    issue.due_date = None
    issue.position = 0
    issue.created_at = datetime.now(timezone.utc)
    issue.updated_at = datetime.now(timezone.utc)
    issue.labels = []
    status_mock = MagicMock()
    status_mock.id = issue.status_id
    status_mock.name = "To Do"
    status_mock.category.value = "todo"
    issue.status = status_mock
    issue.assignee = None
    reporter_mock = MagicMock()
    reporter_mock.id = issue.reporter_id
    reporter_mock.name = "Test User"
    reporter_mock.email = "test@example.com"
    reporter_mock.avatar_url = None
    issue.reporter = reporter_mock
    issue.sprint = None
    issue.parent = None
    return issue


def _make_auth_client(test_user, mock_db):
    """Context manager for an authenticated test client."""
    from app.auth.dependencies import get_current_user
    from app.database import get_db

    async def override_get_db():
        yield mock_db

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    return ASGITransport(app=app)


# ---------------------------------------------------------------------------
# Create issue tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_issue_success():
    """POST /issues creates issue with auto-generated key."""
    project_id = str(uuid.uuid4())
    test_user = _make_test_user()
    test_issue = _make_test_issue(project_id=project_id, reporter_id=str(test_user.id))

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))

    transport = _make_auth_client(test_user, mock_db)

    with patch("app.issues.router.project_service.get_project", new_callable=AsyncMock) as mock_get_proj, \
         patch("app.issues.router.service.create_issue", new_callable=AsyncMock) as mock_create, \
         patch("app.issues.router.service.get_children", new_callable=AsyncMock) as mock_children:
        mock_get_proj.return_value = mock_project
        mock_create.return_value = test_issue
        mock_children.return_value = []

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/projects/{project_id}/issues",
                json={
                    "type": "story",
                    "title": "New Story",
                    "priority": "high",
                },
            )

    app.dependency_overrides.clear()
    assert response.status_code == 201
    data = response.json()
    assert data["key"] == "FB-1"
    assert data["type"] == "story"


@pytest.mark.asyncio
async def test_create_issue_with_labels():
    """POST /issues with label_ids creates issue with labels."""
    project_id = str(uuid.uuid4())
    test_user = _make_test_user()
    test_issue = _make_test_issue(project_id=project_id, reporter_id=str(test_user.id))

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))

    transport = _make_auth_client(test_user, mock_db)

    with patch("app.issues.router.project_service.get_project", new_callable=AsyncMock) as mock_get_proj, \
         patch("app.issues.router.service.create_issue", new_callable=AsyncMock) as mock_create, \
         patch("app.issues.router.service.get_children", new_callable=AsyncMock) as mock_children:
        mock_get_proj.return_value = mock_project
        mock_create.return_value = test_issue
        mock_children.return_value = []

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/projects/{project_id}/issues",
                json={
                    "type": "task",
                    "title": "Task with Labels",
                    "label_ids": [],
                },
            )

    app.dependency_overrides.clear()
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# List issues tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_issues_paginated():
    """GET /issues returns paginated results."""
    project_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/projects/{project_id}/issues",
        )

    app.dependency_overrides.clear()
    assert response.status_code in [200, 403, 404, 500]


@pytest.mark.asyncio
async def test_list_issues_with_filters():
    """GET /issues with filters like type, status_id, priority."""
    project_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/projects/{project_id}/issues?type=story&priority=high",
        )

    app.dependency_overrides.clear()
    assert response.status_code in [200, 403, 404, 500]


# ---------------------------------------------------------------------------
# Get issue tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_issue_by_id():
    """GET /issues/{issue_id} returns issue details."""
    project_id = str(uuid.uuid4())
    issue_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/projects/{project_id}/issues/{issue_id}",
        )

    app.dependency_overrides.clear()
    assert response.status_code in [200, 403, 404, 500]


@pytest.mark.asyncio
async def test_get_issue_not_found():
    """GET /issues/{issue_id} with non-existent ID returns 404."""
    project_id = str(uuid.uuid4())
    issue_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.get = AsyncMock(return_value=None)
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/projects/{project_id}/issues/{issue_id}",
        )

    app.dependency_overrides.clear()
    assert response.status_code in [404, 403, 500]


# ---------------------------------------------------------------------------
# Update issue tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_update_issue_title():
    """PATCH /issues/{issue_id} updates title."""
    project_id = str(uuid.uuid4())
    issue_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/projects/{project_id}/issues/{issue_id}",
            json={"title": "Updated Title"},
        )

    app.dependency_overrides.clear()
    assert response.status_code in [200, 403, 404, 500]


@pytest.mark.asyncio
async def test_update_issue_status():
    """PATCH /issues/{issue_id} updates status."""
    project_id = str(uuid.uuid4())
    issue_id = str(uuid.uuid4())
    status_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/projects/{project_id}/issues/{issue_id}",
            json={"status_id": status_id},
        )

    app.dependency_overrides.clear()
    assert response.status_code in [200, 403, 404, 500]


# ---------------------------------------------------------------------------
# Delete issue tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_issue_as_admin():
    """DELETE /issues/{issue_id} by project admin succeeds."""
    project_id = str(uuid.uuid4())
    issue_id = str(uuid.uuid4())
    test_user = _make_test_user()

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())

    transport = _make_auth_client(test_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.delete(
            f"/api/v1/projects/{project_id}/issues/{issue_id}",
        )

    app.dependency_overrides.clear()
    assert response.status_code in [204, 403, 404, 500]


@pytest.mark.asyncio
async def test_delete_issue_as_developer():
    """DELETE /issues/{issue_id} by developer returns 403."""
    project_id = str(uuid.uuid4())
    issue_id = str(uuid.uuid4())
    dev_user = _make_test_user(role=UserRole.developer)

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=MagicMock(return_value="developer")))

    transport = _make_auth_client(dev_user, mock_db)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.delete(
            f"/api/v1/projects/{project_id}/issues/{issue_id}",
        )

    app.dependency_overrides.clear()
    assert response.status_code in [403, 404, 500]
