"""Tests for project member management endpoints."""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.utils import create_access_token


@pytest.mark.asyncio
async def test_list_members_as_member(client, test_user, test_user_tokens, mock_db):
    """Test listing members returns 200 for project members."""
    project_id = uuid.uuid4()
    other_user = MagicMock()
    other_user.id = uuid.uuid4()
    other_user.name = "Other User"
    other_user.email = "other@example.com"
    other_user.avatar_url = None

    # Mock project
    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

    # Mock members
    member1 = MagicMock()
    member1.user_id = test_user.id
    member1.user = test_user
    member1.role = "admin"
    member1.joined_at = test_user.created_at

    member2 = MagicMock()
    member2.user_id = other_user.id
    member2.user = other_user
    member2.role = "developer"
    member2.joined_at = other_user.created_at

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()

    # First call: check membership
    # Second call: get members list
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"
    mock_db.execute.return_value.scalars.return_value.all.return_value = [member1, member2]

    response = await client.get(
        f"/api/v1/projects/{project_id}/members",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["role"] == "admin"
    assert data[1]["role"] == "developer"


@pytest.mark.asyncio
async def test_list_members_as_non_member(client, test_user, test_user_tokens, mock_db):
    """Test listing members returns 403 for non-members."""
    project_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = None

    response = await client.get(
        f"/api/v1/projects/{project_id}/members",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "not a member" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_add_member_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test adding a member as admin returns 201."""
    project_id = uuid.uuid4()

    new_user = MagicMock()
    new_user.id = uuid.uuid4()
    new_user.name = "New User"
    new_user.email = "new@example.com"
    new_user.avatar_url = None

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    member_mock = MagicMock()
    member_mock.user_id = new_user.id
    member_mock.user = new_user
    member_mock.role = "developer"
    member_mock.joined_at = test_user.created_at

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()

    # First call: check membership (admin)
    # Second call: find user by email
    # Third call: check if already member
    execute_results = [
        MagicMock(scalar_one_or_none=MagicMock(return_value="admin")),
        MagicMock(scalar_one_or_none=MagicMock(return_value=new_user)),
        MagicMock(scalar_one_or_none=MagicMock(return_value=None)),
    ]
    mock_db.execute.side_effect = execute_results
    mock_db.refresh = AsyncMock()

    response = await client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "new@example.com", "role": "developer"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["role"] == "developer"


@pytest.mark.asyncio
async def test_add_member_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test adding a member as developer returns 403."""
    project_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

    response = await client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "new@example.com", "role": "developer"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "project manager" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_add_member_user_not_found(client, test_user, test_user_tokens, mock_db):
    """Test adding non-existent user returns 404."""
    project_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())
    mock_db.execute = AsyncMock()

    execute_results = [
        MagicMock(scalar_one_or_none=MagicMock(return_value="admin")),
        MagicMock(scalar_one_or_none=MagicMock(return_value=None)),
    ]
    mock_db.execute.side_effect = execute_results

    response = await client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "nonexistent@example.com", "role": "developer"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_add_member_already_member(client, test_user, test_user_tokens, mock_db):
    """Test adding user who is already a member returns 409."""
    project_id = uuid.uuid4()

    existing_user = MagicMock()
    existing_user.id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())
    mock_db.execute = AsyncMock()

    execute_results = [
        MagicMock(scalar_one_or_none=MagicMock(return_value="admin")),
        MagicMock(scalar_one_or_none=MagicMock(return_value=existing_user)),
        MagicMock(scalar_one_or_none=MagicMock(return_value=MagicMock())),  # Already member
    ]
    mock_db.execute.side_effect = execute_results

    response = await client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "existing@example.com", "role": "developer"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 409
    assert "already a member" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_member_role_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test updating member role as admin returns 200."""
    project_id = uuid.uuid4()
    target_user_id = uuid.uuid4()

    other_user = MagicMock()
    other_user.id = target_user_id
    other_user.name = "Other User"
    other_user.email = "other@example.com"
    other_user.avatar_url = None

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    member_mock = MagicMock()
    member_mock.user_id = target_user_id
    member_mock.user = other_user
    member_mock.role = "project_manager"
    member_mock.joined_at = test_user.created_at

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()

    execute_results = [
        MagicMock(scalar_one_or_none=MagicMock(return_value="admin")),
        MagicMock(scalar_one_or_none=MagicMock(return_value=member_mock)),
    ]
    mock_db.execute.side_effect = execute_results
    mock_db.refresh = AsyncMock()

    response = await client.patch(
        f"/api/v1/projects/{project_id}/members/{target_user_id}",
        json={"role": "project_manager"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "project_manager"


@pytest.mark.asyncio
async def test_update_member_role_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test updating member role as developer returns 403."""
    project_id = uuid.uuid4()
    target_user_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

    response = await client.patch(
        f"/api/v1/projects/{project_id}/members/{target_user_id}",
        json={"role": "project_manager"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_owner_role_fails(client, test_user, test_user_tokens, mock_db):
    """Test updating owner's role returns 403."""
    project_id = uuid.uuid4()
    owner_id = test_user.id

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = owner_id

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"

    response = await client.patch(
        f"/api/v1/projects/{project_id}/members/{owner_id}",
        json={"role": "developer"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "owner" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_remove_member_as_admin(client, test_user, test_user_tokens, mock_db):
    """Test removing a member as admin returns 204."""
    project_id = uuid.uuid4()
    target_user_id = uuid.uuid4()

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id

    member_mock = MagicMock()
    member_mock.user_id = target_user_id

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()

    execute_results = [
        MagicMock(scalar_one_or_none=MagicMock(return_value="admin")),
        MagicMock(scalar_one_or_none=MagicMock(return_value=member_mock)),
    ]
    mock_db.execute.side_effect = execute_results
    mock_db.delete = AsyncMock()

    response = await client.delete(
        f"/api/v1/projects/{project_id}/members/{target_user_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 204
    assert mock_db.delete.called
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_remove_member_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test removing member as developer returns 403."""
    project_id = uuid.uuid4()
    target_user_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "developer"

    response = await client.delete(
        f"/api/v1/projects/{project_id}/members/{target_user_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "admin" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_remove_owner_fails(client, test_user, test_user_tokens, mock_db):
    """Test removing owner returns 403."""
    project_id = uuid.uuid4()
    owner_id = test_user.id

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = owner_id

    mock_db.get = AsyncMock(return_value=project_mock)
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none.return_value = "admin"

    response = await client.delete(
        f"/api/v1/projects/{project_id}/members/{owner_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "owner" in response.json()["detail"].lower()
