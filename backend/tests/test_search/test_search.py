"""Tests for search functionality."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.dependencies import get_current_user
from app.auth.utils import create_access_token
from app.database import get_db
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


def _setup_auth_client(test_user, mock_db):
    """Set up dependency overrides for an authenticated client."""
    async def override_get_db():
        yield mock_db

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user


@pytest.mark.asyncio
async def test_search_by_text():
    """GET /search with query parameter returns matching issues by title and key."""
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)

    issue1 = _make_test_issue(project_id=project_id, key="FB-1", title="Search for this issue")

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())
    mock_db.scalar = AsyncMock(return_value=1)

    mock_project = MagicMock(id=uuid.UUID(project_id))

    _setup_auth_client(test_user, mock_db)

    from app.projects import service as project_service
    from app.issues import service as issues_service

    original_get_project = project_service.get_project
    original_get_issues = issues_service.get_issues

    async def mock_get_project(db, proj_id, user):
        return mock_project

    async def mock_get_issues(db, proj_id, page, size, type_, status_id, priority, assignee_id, sprint_id, label_id, search):
        if search and "Search" in search:
            return [issue1], 1
        return [], 0

    project_service.get_project = mock_get_project
    issues_service.get_issues = mock_get_issues

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/projects/{project_id}/search?q=Search",
            )

        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
        issues_service.get_issues = original_get_issues
        project_service.get_project = original_get_project


@pytest.mark.asyncio
async def test_search_by_type_and_priority():
    """GET /search with type and priority filters returns matching issues."""
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)

    issue = _make_test_issue(
        project_id=project_id,
        key="FB-1",
        title="High Priority Story",
        type_=IssueType.story,
        priority=IssuePriority.high,
    )

    mock_db = AsyncMock()
    mock_db.execute = AsyncMock(return_value=MagicMock())
    mock_db.scalar = AsyncMock(return_value=1)

    mock_project = MagicMock(id=uuid.UUID(project_id))

    _setup_auth_client(test_user, mock_db)

    from app.projects import service as project_service
    from app.issues import service as issues_service

    original_get_project = project_service.get_project
    original_get_issues = issues_service.get_issues

    async def mock_get_project(db, proj_id, user):
        return mock_project

    async def mock_get_issues(db, proj_id, page, size, type_, status_id, priority, assignee_id, sprint_id, label_id, search):
        if type_ == "story" and priority == "high":
            return [issue], 1
        return [], 0

    project_service.get_project = mock_get_project
    issues_service.get_issues = mock_get_issues

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get(
                f"/api/v1/projects/{project_id}/search?type=story&priority=high",
            )

        assert response.status_code == 200
    finally:
        app.dependency_overrides.clear()
        issues_service.get_issues = original_get_issues
        project_service.get_project = original_get_project


@pytest.mark.asyncio
async def test_create_saved_filter():
    """POST /filters/saved creates a new saved filter."""
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))
    mock_filter = _make_test_saved_filter(project_id=project_id, user_id=user_id, name="My Filter")

    _setup_auth_client(test_user, mock_db)

    from app.projects import service as project_service
    from app.search import service as search_service

    original_get_project = project_service.get_project
    original_create = search_service.create_saved_filter

    async def mock_get_project(db, proj_id, user):
        return mock_project

    async def mock_create_saved_filter(db, proj_id, user, data):
        return mock_filter

    project_service.get_project = mock_get_project
    search_service.create_saved_filter = mock_create_saved_filter

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                f"/api/v1/projects/{project_id}/filters/saved",
                json={"name": "My Filter", "filters": {"type": "story", "priority": "high"}},
            )

        assert response.status_code == 201
    finally:
        app.dependency_overrides.clear()
        search_service.create_saved_filter = original_create
        project_service.get_project = original_get_project


@pytest.mark.asyncio
async def test_delete_saved_filter():
    """DELETE /filters/saved/{filter_id} deletes the saved filter."""
    project_id = str(uuid.uuid4())
    filter_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    test_user = _make_test_user(user_id=user_id)

    mock_db = AsyncMock()
    mock_project = MagicMock(id=uuid.UUID(project_id))

    _setup_auth_client(test_user, mock_db)

    from app.projects import service as project_service
    from app.search import service as search_service

    original_get_project = project_service.get_project
    original_delete = search_service.delete_saved_filter

    async def mock_get_project(db, proj_id, user):
        return mock_project

    async def mock_delete_saved_filter(db, filt_id, usr_id):
        return None

    project_service.get_project = mock_get_project
    search_service.delete_saved_filter = mock_delete_saved_filter

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.delete(
                f"/api/v1/projects/{project_id}/filters/saved/{filter_id}",
            )

        assert response.status_code == 204
    finally:
        app.dependency_overrides.clear()
        search_service.delete_saved_filter = original_delete
        project_service.get_project = original_get_project
