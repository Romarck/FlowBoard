"""Tests for project CRUD operations."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.models import UserRole
from app.auth.utils import create_access_token
from app.projects.models import ProjectMethodology, StatusCategory
from app.projects.service import generate_project_key


class TestGenerateProjectKey:
    """Test project key generation."""

    def test_generate_project_key_single_word(self):
        """Single word name generates key from first 3 letters."""
        assert generate_project_key("flowboard") == "FLO"

    def test_generate_project_key_multi_word(self):
        """Multi-word name generates key from first letters."""
        assert generate_project_key("Flow Board App") == "FBA"

    def test_generate_project_key_with_special_chars(self):
        """Special characters are stripped."""
        assert generate_project_key("My-Project-2024") == "MP2"

    def test_generate_project_key_fallback(self):
        """Empty or invalid names fallback to PROJ."""
        assert generate_project_key("!@#$") == "PROJ"


@pytest.mark.asyncio
async def test_create_project_success(client, test_user, test_user_tokens, mock_db):
    """Test successful project creation with default statuses and member."""
    # Mock the project creation behavior
    project_id = uuid.uuid4()

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.name = "Test Project"
    project_mock.key = "TP"
    project_mock.description = "A test project"
    project_mock.methodology = ProjectMethodology.kanban
    project_mock.owner_id = test_user.id
    project_mock.issue_counter = 0
    project_mock.created_at = test_user.created_at
    project_mock.updated_at = test_user.updated_at

    # Create mock workflow statuses
    workflow_statuses = []
    for i, status_data in enumerate(
        [
            {"name": "To Do", "category": StatusCategory.todo, "position": 0},
            {"name": "In Progress", "category": StatusCategory.in_progress, "position": 1},
            {"name": "In Review", "category": StatusCategory.in_progress, "position": 2},
            {"name": "Done", "category": StatusCategory.done, "position": 3},
        ]
    ):
        status_mock = MagicMock()
        status_mock.id = uuid.uuid4()
        status_mock.project_id = project_id
        status_mock.name = status_data["name"]
        status_mock.category = status_data["category"]
        status_mock.position = status_data["position"]
        status_mock.wip_limit = None
        workflow_statuses.append(status_mock)

    project_mock.workflow_statuses = workflow_statuses

    member_mock = MagicMock()
    member_mock.user_id = test_user.id
    member_mock.role = "admin"
    project_mock.members = [member_mock]

    # Mock db.flush and db.get behavior
    mock_db.flush = AsyncMock()
    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.refresh = AsyncMock()

    # Make request with auth token
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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.name = "Flow Board App"
    project_mock.key = "FBA"
    project_mock.description = None
    project_mock.methodology = ProjectMethodology.kanban
    project_mock.owner_id = test_user.id
    project_mock.issue_counter = 0
    project_mock.created_at = test_user.created_at
    project_mock.updated_at = test_user.updated_at
    project_mock.workflow_statuses = []
    project_mock.members = [MagicMock(user_id=test_user.id, role="admin")]

    mock_db.flush = AsyncMock()
    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.refresh = AsyncMock()

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
    from sqlalchemy.exc import IntegrityError

    mock_db.flush = AsyncMock(side_effect=IntegrityError("", "", ""))
    mock_db.rollback = AsyncMock()

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
    projects = [
        MagicMock(
            id=uuid.uuid4(),
            name=f"Project {i}",
            key=f"P{i}",
            description=None,
            methodology=ProjectMethodology.kanban,
            created_at=test_user.created_at,
            members=[MagicMock(user_id=test_user.id)],
        )
        for i in range(5)
    ]

    # Mock scalar for count and execute for list
    mock_db.scalar = AsyncMock(return_value=5)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalars.return_value.all.return_value = projects[:2]

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
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.name = "Test Project"
    project_mock.key = "TP"
    project_mock.description = None
    project_mock.methodology = ProjectMethodology.kanban
    project_mock.owner_id = test_user.id
    project_mock.issue_counter = 0
    project_mock.created_at = test_user.created_at
    project_mock.updated_at = test_user.updated_at
    project_mock.workflow_statuses = []
    project_mock.members = [MagicMock(user_id=test_user.id, role="developer")]

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

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
    project_id = uuid.uuid4()
    mock_db.get = AsyncMock(return_value=None)

    response = await client.get(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_project_as_non_member(client, test_user, test_user_tokens, mock_db):
    """Test retrieving a project as non-member returns 403."""
    project_id = uuid.uuid4()
    project_mock = MagicMock()
    project_mock.id = project_id

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = None

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
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.name = "Test Project"
    project_mock.key = "TP"
    project_mock.description = None
    project_mock.methodology = ProjectMethodology.kanban
    project_mock.owner_id = test_user.id
    project_mock.issue_counter = 0
    project_mock.created_at = test_user.created_at
    project_mock.updated_at = test_user.created_at
    project_mock.workflow_statuses = []
    project_mock.members = [MagicMock(user_id=test_user.id, role="admin")]

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.refresh = AsyncMock()

    response = await client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Updated Project", "methodology": "scrum"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_update_project_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test updating a project as developer returns 403."""
    project_id = uuid.uuid4()
    project_mock = MagicMock()
    project_mock.id = project_id

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

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

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.delete = AsyncMock()

    response = await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 204
    assert mock_db.delete.called
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_delete_project_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test deleting a project as developer returns 403."""
    project_id = uuid.uuid4()
    project_mock = MagicMock()
    project_mock.id = project_id

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

    response = await client.delete(
        f"/api/v1/projects/{project_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()
