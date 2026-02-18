"""Tests for workflow statuses and labels endpoints."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.utils import create_access_token


@pytest.mark.asyncio
async def test_list_statuses_as_member(client, test_user, test_user_tokens, mock_db):
    """Test listing statuses returns 200 with all 4 default statuses."""
    project_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    # Mock statuses
    status1 = MagicMock()
    status1.id = uuid.uuid4()
    status1.name = "To Do"
    status1.category.value = "todo"
    status1.position = 0
    status1.wip_limit = None

    status2 = MagicMock()
    status2.id = uuid.uuid4()
    status2.name = "In Progress"
    status2.category.value = "in_progress"
    status2.position = 1
    status2.wip_limit = None

    status3 = MagicMock()
    status3.id = uuid.uuid4()
    status3.name = "In Review"
    status3.category.value = "in_progress"
    status3.position = 2
    status3.wip_limit = None

    status4 = MagicMock()
    status4.id = uuid.uuid4()
    status4.name = "Done"
    status4.category.value = "done"
    status4.position = 3
    status4.wip_limit = None

    # Mock get for project
    async def get_mock(model, project_id):
        if model == type(project_mock):
            return project_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)

    # Mock execute for membership check
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.execute.return_value.scalars.return_value.all.return_value = [
        status1, status2, status3, status4
    ]

    response = await client.get(
        f"/api/v1/projects/{project_id}/statuses",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert data[0]["name"] == "To Do"
    assert data[0]["category"] == "todo"
    assert data[1]["name"] == "In Progress"
    assert data[3]["name"] == "Done"


@pytest.mark.asyncio
async def test_list_statuses_as_non_member(client, test_user, test_user_tokens, mock_db):
    """Test listing statuses returns 403 for non-members."""
    project_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=None)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    response = await client.get(
        f"/api/v1/projects/{project_id}/statuses",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_labels_empty(client, test_user, test_user_tokens, mock_db):
    """Test listing labels returns empty list when no labels exist."""
    project_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    async def get_mock(model, project_id):
        if model == type(project_mock):
            return project_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.execute.return_value.scalars.return_value.all.return_value = []

    response = await client.get(
        f"/api/v1/projects/{project_id}/labels",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data == []


@pytest.mark.asyncio
async def test_create_label_success(client, test_user, test_user_tokens, mock_db):
    """Test creating a label with valid name and color."""
    project_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    # Mock label
    label_mock = MagicMock()
    label_mock.id = uuid.uuid4()
    label_mock.project_id = project_id
    label_mock.name = "bug"
    label_mock.color = "#EF4444"

    async def get_mock(model, project_id):
        if model == type(project_mock):
            return project_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    response = await client.post(
        f"/api/v1/projects/{project_id}/labels",
        json={"name": "bug", "color": "#EF4444"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "bug"
    assert data["color"] == "#EF4444"


@pytest.mark.asyncio
async def test_create_label_invalid_color(client, test_user, test_user_tokens, mock_db):
    """Test creating a label with invalid hex color returns 422."""
    project_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    async def get_mock(model, project_id):
        if model == type(project_mock):
            return project_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"

    response = await client.post(
        f"/api/v1/projects/{project_id}/labels",
        json={"name": "bug", "color": "red"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_label_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test updating a label as admin succeeds."""
    project_id = uuid.uuid4()
    label_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    # Mock label
    label_mock = MagicMock()
    label_mock.id = label_id
    label_mock.project_id = project_id
    label_mock.name = "feature"
    label_mock.color = "#22C55E"

    async def get_mock(model, project_id_arg):
        if model == type(project_mock):
            return project_mock
        if model == type(label_mock) and project_id_arg == label_id:
            return label_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    response = await client.patch(
        f"/api/v1/projects/{project_id}/labels/{label_id}",
        json={"name": "feature", "color": "#22C55E"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "feature"


@pytest.mark.asyncio
async def test_update_label_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test updating a label as developer returns 403."""
    project_id = uuid.uuid4()
    label_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    async def get_mock(model, project_id_arg):
        if model == type(project_mock):
            return project_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

    response = await client.patch(
        f"/api/v1/projects/{project_id}/labels/{label_id}",
        json={"name": "feature"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_label_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test deleting a label as admin succeeds."""
    project_id = uuid.uuid4()
    label_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    # Mock label
    label_mock = MagicMock()
    label_mock.id = label_id
    label_mock.project_id = project_id

    async def get_mock(model, project_id_arg):
        if model == type(project_mock):
            return project_mock
        if model == type(label_mock) and project_id_arg == label_id:
            return label_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.delete = MagicMock()
    mock_db.commit = AsyncMock()

    response = await client.delete(
        f"/api/v1/projects/{project_id}/labels/{label_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_label_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test deleting a label as developer returns 403."""
    project_id = uuid.uuid4()
    label_id = uuid.uuid4()

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    async def get_mock(model, project_id_arg):
        if model == type(project_mock):
            return project_mock
        return None

    mock_db.get = AsyncMock(side_effect=get_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

    response = await client.delete(
        f"/api/v1/projects/{project_id}/labels/{label_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
