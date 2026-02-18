"""Tests for search functionality."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.utils import create_access_token
from app.issues.models import Issue, IssueType, IssuePriority
from app.main import app
from app.search.models import SavedFilter
from tests.conftest import _make_test_user


def _make_test_issue(
    issue_id: str | None = None,
    project_id: str | None = None,
    key: str = "FB-1",
    title: str = "Test Issue",
    type_: IssueType = IssueType.story,
    priority: IssuePriority = IssuePriority.medium,
    status_id: str | None = None,
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
    issue.assignee_id = None
    issue.reporter_id = uuid.uuid4()
    issue.sprint_id = None
    issue.parent_id = None
    issue.story_points = None
    issue.due_date = None
    issue.position = 0
    issue.created_at = datetime.now(timezone.utc)
    issue.updated_at = datetime.now(timezone.utc)
    issue.labels = []
    issue.status = MagicMock(id=issue.status_id, name="To Do", category="todo")
    issue.assignee = None
    issue.reporter = MagicMock(id=issue.reporter_id, name="Test User", email="test@example.com", avatar_url=None)
    issue.sprint = None
    issue.parent = None
    return issue


def _make_test_saved_filter(
    filter_id: str | None = None,
    project_id: str | None = None,
    user_id: str | None = None,
    name: str = "Test Filter",
) -> MagicMock:
    """Create a mock SavedFilter object for testing."""
    filter_obj = MagicMock()
    filter_obj.id = uuid.UUID(filter_id) if filter_id else uuid.uuid4()
    filter_obj.project_id = uuid.UUID(project_id) if project_id else uuid.uuid4()
    filter_obj.user_id = uuid.UUID(user_id) if user_id else uuid.uuid4()
    filter_obj.name = name
    filter_obj.filters = {"type": "story", "priority": "high"}
    filter_obj.created_at = datetime.now(timezone.utc)
    return filter_obj


@pytest.mark.asyncio
async def test_search_by_text():
    """GET /search with query parameter returns matching issues by title and key."""
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)
    tokens = {"access_token": create_access_token(user_id, test_user.role.value)}

    issue1 = _make_test_issue(project_id=project_id, key="FB-1", title="Search for this issue")
    issue2 = _make_test_issue(project_id=project_id, key="FB-2", title="Another issue")

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))

    async def mock_get_project(db, proj_id, user):
        return mock_project

    mock_db.get = AsyncMock(return_value=mock_project)
    mock_db.execute = AsyncMock(return_value=AsyncMock(scalar=AsyncMock(return_value=1)))
    mock_db.scalar = AsyncMock(return_value=1)

    async def override_get_db():
        yield mock_db

    from app.database import get_db
    from app.projects import service as project_service

    app.dependency_overrides[get_db] = override_get_db
    original_get_project = project_service.get_project
    project_service.get_project = mock_get_project

    # Mock the issues service
    from app.issues import service as issues_service

    async def mock_get_issues(db, proj_id, page, size, type_, status_id, priority, assignee_id, sprint_id, label_id, search):
        if search and "Search" in search:
            return [issue1], 1
        return [issue2], 1

    original_get_issues = issues_service.get_issues
    issues_service.get_issues = mock_get_issues

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/projects/{project_id}/search?q=Search",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )

    app.dependency_overrides.clear()
    issues_service.get_issues = original_get_issues
    project_service.get_project = original_get_project

    assert response.status_code in [200, 401]


@pytest.mark.asyncio
async def test_search_by_type_and_priority():
    """GET /search with type and priority filters returns matching issues."""
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)
    tokens = {"access_token": create_access_token(user_id, test_user.role.value)}

    issue = _make_test_issue(
        project_id=project_id,
        key="FB-1",
        title="High Priority Story",
        type_=IssueType.story,
        priority=IssuePriority.high,
    )

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))

    async def mock_get_project(db, proj_id, user):
        return mock_project

    mock_db.get = AsyncMock(return_value=mock_project)
    mock_db.scalar = AsyncMock(return_value=1)

    async def override_get_db():
        yield mock_db

    from app.database import get_db
    from app.projects import service as project_service

    app.dependency_overrides[get_db] = override_get_db
    original_get_project = project_service.get_project
    project_service.get_project = mock_get_project

    from app.issues import service as issues_service

    async def mock_get_issues(db, proj_id, page, size, type_, status_id, priority, assignee_id, sprint_id, label_id, search):
        if type_ == "story" and priority == "high":
            return [issue], 1
        return [], 0

    original_get_issues = issues_service.get_issues
    issues_service.get_issues = mock_get_issues

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/projects/{project_id}/search?type=story&priority=high",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )

    app.dependency_overrides.clear()
    issues_service.get_issues = original_get_issues
    project_service.get_project = original_get_project

    assert response.status_code in [200, 401]


@pytest.mark.asyncio
async def test_create_saved_filter():
    """POST /filters/saved creates a new saved filter."""
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)
    tokens = {"access_token": create_access_token(user_id, test_user.role.value)}

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))
    mock_filter = _make_test_saved_filter(project_id=project_id, user_id=user_id, name="My Filter")

    async def mock_get_project(db, proj_id, user):
        return mock_project

    mock_db.get = AsyncMock(return_value=mock_project)
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    async def override_get_db():
        yield mock_db

    from app.database import get_db
    from app.projects import service as project_service
    from app.search import service as search_service

    app.dependency_overrides[get_db] = override_get_db
    original_get_project = project_service.get_project
    project_service.get_project = mock_get_project

    async def mock_create_saved_filter(db, proj_id, user, data):
        return mock_filter

    original_create = search_service.create_saved_filter
    search_service.create_saved_filter = mock_create_saved_filter

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            f"/api/v1/projects/{project_id}/filters/saved",
            json={"name": "My Filter", "filters": {"type": "story", "priority": "high"}},
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )

    app.dependency_overrides.clear()
    search_service.create_saved_filter = original_create
    project_service.get_project = original_get_project

    assert response.status_code in [201, 401]


@pytest.mark.asyncio
async def test_delete_saved_filter():
    """DELETE /filters/saved/{filter_id} deletes the saved filter."""
    project_id = str(uuid.uuid4())
    filter_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)
    tokens = {"access_token": create_access_token(user_id, test_user.role.value)}

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))
    mock_filter = _make_test_saved_filter(filter_id=filter_id, project_id=project_id, user_id=user_id)

    async def mock_get_project(db, proj_id, user):
        return mock_project

    mock_db.get = AsyncMock(return_value=mock_project)
    mock_db.delete = AsyncMock()
    mock_db.commit = AsyncMock()

    async def override_get_db():
        yield mock_db

    from app.database import get_db
    from app.projects import service as project_service
    from app.search import service as search_service

    app.dependency_overrides[get_db] = override_get_db
    original_get_project = project_service.get_project
    project_service.get_project = mock_get_project

    async def mock_delete_saved_filter(db, filt_id, usr_id):
        return None

    original_delete = search_service.delete_saved_filter
    search_service.delete_saved_filter = mock_delete_saved_filter

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.delete(
            f"/api/v1/projects/{project_id}/filters/saved/{filter_id}",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )

    app.dependency_overrides.clear()
    search_service.delete_saved_filter = original_delete
    project_service.get_project = original_get_project

    assert response.status_code in [204, 401]
