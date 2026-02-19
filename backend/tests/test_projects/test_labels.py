"""Tests for workflow statuses and labels endpoints."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.utils import create_access_token


def _mock_execute_result(**kwargs):
    """Create a MagicMock that behaves like an SQLAlchemy execute result.

    Supports:
        scalar_one_or_none=<value>
        scalars_all=<list>
    """
    result = MagicMock()
    if "scalar_one_or_none" in kwargs:
        result.scalar_one_or_none.return_value = kwargs["scalar_one_or_none"]
    if "scalars_all" in kwargs:
        result.scalars.return_value.all.return_value = kwargs["scalars_all"]
    return result


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
    statuses = []
    for name, cat_val, pos in [
        ("To Do", "todo", 0),
        ("In Progress", "in_progress", 1),
        ("In Review", "in_progress", 2),
        ("Done", "done", 3),
    ]:
        s = MagicMock()
        s.id = uuid.uuid4()
        s.name = name
        s.category.value = cat_val
        s.position = pos
        s.wip_limit = None
        statuses.append(s)

    # db.get returns project (for get_project verification)
    mock_db.get = AsyncMock(return_value=project_mock)

    # db.execute is called twice:
    # 1) get_user_role_in_project -> scalar_one_or_none
    # 2) get_statuses -> scalars().all()
    role_result = _mock_execute_result(scalar_one_or_none="admin")
    statuses_result = _mock_execute_result(scalars_all=statuses)
    mock_db.execute = AsyncMock(side_effect=[role_result, statuses_result])

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

    project_mock = MagicMock()
    project_mock.id = project_id
    mock_db.get = AsyncMock(return_value=project_mock)

    # Role check returns None (not a member)
    role_result = _mock_execute_result(scalar_one_or_none=None)
    mock_db.execute = AsyncMock(return_value=role_result)

    response = await client.get(
        f"/api/v1/projects/{project_id}/statuses",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_labels_empty(client, test_user, test_user_tokens, mock_db):
    """Test listing labels returns empty list when no labels exist."""
    project_id = uuid.uuid4()

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    mock_db.get = AsyncMock(return_value=project_mock)

    role_result = _mock_execute_result(scalar_one_or_none="admin")
    labels_result = _mock_execute_result(scalars_all=[])
    mock_db.execute = AsyncMock(side_effect=[role_result, labels_result])

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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    mock_db.get = AsyncMock(return_value=project_mock)

    # get_project role check
    role_result = _mock_execute_result(scalar_one_or_none="admin")
    mock_db.execute = AsyncMock(return_value=role_result)
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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    mock_db.get = AsyncMock(return_value=project_mock)

    role_result = _mock_execute_result(scalar_one_or_none="admin")
    mock_db.execute = AsyncMock(return_value=role_result)

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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    label_mock = MagicMock()
    label_mock.id = label_id
    label_mock.project_id = project_id
    label_mock.name = "feature"
    label_mock.color = "#22C55E"

    from app.projects.models import Project, Label

    async def smart_get(model, eid):
        if model is Project:
            return project_mock
        if model is Label:
            return label_mock
        return None

    mock_db.get = AsyncMock(side_effect=smart_get)

    # 1) get_project role check, 2) update_label role check
    role_result = _mock_execute_result(scalar_one_or_none="admin")
    mock_db.execute = AsyncMock(return_value=role_result)
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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    mock_db.get = AsyncMock(return_value=project_mock)

    role_result = _mock_execute_result(scalar_one_or_none="developer")
    mock_db.execute = AsyncMock(return_value=role_result)

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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    label_mock = MagicMock()
    label_mock.id = label_id
    label_mock.project_id = project_id

    from app.projects.models import Project, Label

    async def smart_get(model, eid):
        if model is Project:
            return project_mock
        if model is Label:
            return label_mock
        return None

    mock_db.get = AsyncMock(side_effect=smart_get)

    role_result = _mock_execute_result(scalar_one_or_none="admin")
    mock_db.execute = AsyncMock(return_value=role_result)
    mock_db.delete = AsyncMock()
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

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    mock_db.get = AsyncMock(return_value=project_mock)

    role_result = _mock_execute_result(scalar_one_or_none="developer")
    mock_db.execute = AsyncMock(return_value=role_result)

    response = await client.delete(
        f"/api/v1/projects/{project_id}/labels/{label_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
