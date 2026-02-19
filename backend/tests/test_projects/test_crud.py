"""Tests for project CRUD operations."""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.auth.models import UserRole
from app.auth.utils import create_access_token
from app.projects.models import ProjectMethodology, StatusCategory
from app.projects.service import generate_project_key


def _exec_result(**kwargs):
    """Create a MagicMock SQLAlchemy execute result."""
    r = MagicMock()
    if "scalar" in kwargs:
        r.scalar_one_or_none.return_value = kwargs["scalar"]
    if "scalars_all" in kwargs:
        r.scalars.return_value.all.return_value = kwargs["scalars_all"]
    return r


def _make_project_mock(project_id, owner_id, **overrides):
    """Create a standard project mock."""
    now = datetime.now(timezone.utc)
    p = MagicMock()
    p.id = project_id
    p.name = overrides.get("name", "Test Project")
    p.key = overrides.get("key", "TP")
    p.description = overrides.get("description", None)
    p.methodology = overrides.get("methodology", ProjectMethodology.kanban)
    p.owner_id = owner_id
    p.issue_counter = overrides.get("issue_counter", 0)
    p.created_at = overrides.get("created_at", now)
    p.updated_at = overrides.get("updated_at", now)

    # Default workflow statuses
    p.workflow_statuses = overrides.get("workflow_statuses", [])
    p.members = overrides.get("members", [])
    return p


class TestGenerateProjectKey:
    """Test project key generation."""

    def test_generate_project_key_single_word(self):
        """Single word name generates key from first 3 letters."""
        assert generate_project_key("flowboard") == "FLO"

    def test_generate_project_key_multi_word(self):
        """Multi-word name generates key from first letters."""
        assert generate_project_key("Flow Board App") == "FBA"

    def test_generate_project_key_with_special_chars(self):
        """Special characters are stripped.

        'My-Project-2024' splits into ['My-Project-2024'] (single word with hyphens).
        Single word: take first 3 chars -> 'My-', strip non-alphanum -> 'MY',
        then upper[:10] -> 'MY'.
        """
        result = generate_project_key("My-Project-2024")
        # The hyphenated string is treated as a single word, first 3 chars = 'My-'
        # After stripping non-alphanumeric: 'MY'
        assert result == "MY"

    def test_generate_project_key_fallback(self):
        """Empty or invalid names fallback to PROJ."""
        assert generate_project_key("!@#$") == "PROJ"


@pytest.mark.asyncio
async def test_create_project_success(client, test_user, test_user_tokens, mock_db):
    """Test successful project creation with default statuses and member."""
    project_id = uuid.uuid4()

    # Create mock workflow statuses
    workflow_statuses = []
    for name, cat, pos in [
        ("To Do", StatusCategory.todo, 0),
        ("In Progress", StatusCategory.in_progress, 1),
        ("In Review", StatusCategory.in_progress, 2),
        ("Done", StatusCategory.done, 3),
    ]:
        ws = MagicMock()
        ws.id = uuid.uuid4()
        ws.project_id = project_id
        ws.name = name
        ws.category = cat
        ws.position = pos
        ws.wip_limit = None
        workflow_statuses.append(ws)

    member_mock = MagicMock()
    member_mock.user_id = test_user.id
    member_mock.role = "admin"

    project_mock = _make_project_mock(
        project_id, test_user.id,
        name="Test Project",
        key="TP",
        description="A test project",
        workflow_statuses=workflow_statuses,
        members=[member_mock],
    )

    # Patch the entire create_project service to return our mock
    with patch("app.projects.router.service.create_project", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = project_mock

        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Test Project",
                "key": "TP",
                "description": "A test project",
                "methodology": "kanban",
            },
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["key"] == "TP"
    assert data["methodology"] == "kanban"
    assert len(data["workflow_statuses"]) == 4
    assert data["member_count"] == 1


@pytest.mark.asyncio
async def test_create_project_auto_key(client, test_user, test_user_tokens, mock_db):
    """Test project creation with auto-generated key."""
    project_id = uuid.uuid4()

    project_mock = _make_project_mock(
        project_id, test_user.id,
        name="Flow Board App",
        key="FBA",
        members=[MagicMock(user_id=test_user.id, role="admin")],
    )

    with patch("app.projects.router.service.create_project", new_callable=AsyncMock) as mock_create:
        mock_create.return_value = project_mock

        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Flow Board App",
                "methodology": "kanban",
            },
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["key"] == "FBA"


@pytest.mark.asyncio
async def test_create_project_duplicate_key(client, test_user, test_user_tokens, mock_db):
    """Test project creation fails with duplicate key."""
    from fastapi import HTTPException

    with patch("app.projects.router.service.create_project", new_callable=AsyncMock) as mock_create:
        mock_create.side_effect = HTTPException(409, "Project key already in use")

        response = await client.post(
            "/api/v1/projects",
            json={
                "name": "Test Project",
                "key": "EXISTING",
                "methodology": "kanban",
            },
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 409
    assert "already in use" in response.json()["detail"]


@pytest.mark.asyncio
async def test_list_projects_pagination(client, test_user, test_user_tokens, mock_db):
    """Test project list with pagination."""
    now = datetime.now(timezone.utc)
    projects = []
    for i in range(2):
        p = MagicMock()
        p.id = uuid.uuid4()
        p.name = f"Project {i}"  # MagicMock(name=...) sets mock name, not attribute
        p.key = f"P{i}"
        p.description = None
        p.methodology = ProjectMethodology.kanban
        p.created_at = now
        p.members = [MagicMock(user_id=test_user.id)]
        projects.append(p)

    with patch("app.projects.router.service.get_projects", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = (projects, 5)

        response = await client.get(
            "/api/v1/projects?page=1&size=2",
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["size"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_get_project_as_member(client, test_user, test_user_tokens, mock_db):
    """Test retrieving a project as a member."""
    project_id = uuid.uuid4()
    project_mock = _make_project_mock(
        project_id, test_user.id,
        members=[MagicMock(user_id=test_user.id, role="developer")],
    )

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = project_mock

        response = await client.get(
            f"/api/v1/projects/{project_id}",
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"


@pytest.mark.asyncio
async def test_get_project_not_found(client, test_user, test_user_tokens, mock_db):
    """Test retrieving non-existent project returns 404."""
    from fastapi import HTTPException

    project_id = uuid.uuid4()

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = HTTPException(404, "Project not found")

        response = await client.get(
            f"/api/v1/projects/{project_id}",
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_project_as_non_member(client, test_user, test_user_tokens, mock_db):
    """Test retrieving a project as non-member returns 403."""
    from fastapi import HTTPException

    project_id = uuid.uuid4()

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = HTTPException(403, "You are not a member of this project")

        response = await client.get(
            f"/api/v1/projects/{project_id}",
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 403
    assert "not a member" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_project_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test updating a project as admin."""
    project_id = uuid.uuid4()
    project_mock = _make_project_mock(
        project_id, test_user.id,
        name="Updated Project",
        methodology=ProjectMethodology.scrum,
        members=[MagicMock(user_id=test_user.id, role="admin")],
    )

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get, \
         patch("app.projects.router.service.update_project", new_callable=AsyncMock) as mock_update:
        mock_get.return_value = project_mock
        mock_update.return_value = project_mock

        response = await client.patch(
            f"/api/v1/projects/{project_id}",
            json={"name": "Updated Project", "methodology": "scrum"},
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_project_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test updating a project as developer returns 403."""
    from fastapi import HTTPException

    project_id = uuid.uuid4()
    project_mock = MagicMock()
    project_mock.id = project_id

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get, \
         patch("app.projects.router.service.update_project", new_callable=AsyncMock) as mock_update:
        mock_get.return_value = project_mock
        mock_update.side_effect = HTTPException(403, "Only admins and project managers can update projects")

        response = await client.patch(
            f"/api/v1/projects/{project_id}",
            json={"name": "Updated Project"},
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_project_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test deleting a project as admin."""
    project_id = uuid.uuid4()
    project_mock = MagicMock()
    project_mock.id = project_id

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get, \
         patch("app.projects.router.service.delete_project", new_callable=AsyncMock) as mock_delete:
        mock_get.return_value = project_mock

        response = await client.delete(
            f"/api/v1/projects/{project_id}",
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 204
    assert mock_delete.called


@pytest.mark.asyncio
async def test_delete_project_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test deleting a project as developer returns 403."""
    from fastapi import HTTPException

    project_id = uuid.uuid4()
    project_mock = MagicMock()
    project_mock.id = project_id

    with patch("app.projects.router.service.get_project", new_callable=AsyncMock) as mock_get, \
         patch("app.projects.router.service.delete_project", new_callable=AsyncMock) as mock_delete:
        mock_get.return_value = project_mock
        mock_delete.side_effect = HTTPException(403, "Only admins can delete projects")

        response = await client.delete(
            f"/api/v1/projects/{project_id}",
            headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
        )

    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()
