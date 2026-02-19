"""Tests for project member management endpoints."""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.auth.utils import create_access_token


def _exec_result(**kwargs):
    """Create a MagicMock SQLAlchemy execute result."""
    r = MagicMock()
    if "scalar" in kwargs:
        r.scalar_one_or_none.return_value = kwargs["scalar"]
    if "scalars_all" in kwargs:
        r.scalars.return_value.all.return_value = kwargs["scalars_all"]
    return r


@pytest.mark.asyncio
async def test_list_members_as_member(client, test_user, test_user_tokens, mock_db):
    """Test listing members returns 200 for project members."""
    project_id = uuid.uuid4()
    other_user = MagicMock()
    other_user.id = uuid.uuid4()
    other_user.name = "Other User"
    other_user.email = "other@example.com"
    other_user.avatar_url = None
    other_user.created_at = datetime.now(timezone.utc)

    project_mock = MagicMock()
    project_mock.id = project_id
    project_mock.owner_id = test_user.id
    project_mock.members = []

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

    # 1) get_project->get_user_role_in_project, 2) get_members
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="admin"),
        _exec_result(scalars_all=[member1, member2]),
    ])

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
    mock_db.execute = AsyncMock(return_value=_exec_result(scalar=None))

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

    mock_db.get = AsyncMock(return_value=project_mock)

    # 1) get_project->role check, 2) router role check, 3) find user by email, 4) check already member
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="admin"),     # get_project membership
        _exec_result(scalar="admin"),     # router permission check
        _exec_result(scalar=new_user),    # find user by email
        _exec_result(scalar=None),        # not already a member
    ])

    async def refresh_with_user(member):
        """Simulate eager-loading the user relationship on refresh."""
        member.user = new_user

    mock_db.refresh = AsyncMock(side_effect=refresh_with_user)

    response = await client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "new@example.com", "role": "developer"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "developer"


@pytest.mark.asyncio
async def test_add_member_as_developer(client, test_user, test_user_tokens, mock_db):
    """Test adding a member as developer returns 403."""
    project_id = uuid.uuid4()

    mock_db.get = AsyncMock(return_value=MagicMock())

    # 1) get_project role check, 2) router role check
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="developer"),  # get_project membership
        _exec_result(scalar="developer"),  # router permission check -> fails
    ])

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

    # 1) get_project role, 2) router role, 3) find user by email -> None
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="admin"),
        _exec_result(scalar="admin"),
        _exec_result(scalar=None),  # user not found
    ])

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

    # 1) get_project role, 2) router role, 3) find user, 4) already member
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="admin"),
        _exec_result(scalar="admin"),
        _exec_result(scalar=existing_user),
        _exec_result(scalar=MagicMock()),  # already a member
    ])

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

    # 1) get_project role, 2) router admin check, 3) find member to update
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="admin"),
        _exec_result(scalar="admin"),
        _exec_result(scalar=member_mock),
    ])
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
    mock_db.execute = AsyncMock(return_value=_exec_result(scalar="developer"))

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

    # 1) get_project role, 2) router admin check
    mock_db.execute = AsyncMock(return_value=_exec_result(scalar="admin"))

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

    # 1) get_project role, 2) router admin check, 3) find member to remove
    mock_db.execute = AsyncMock(side_effect=[
        _exec_result(scalar="admin"),
        _exec_result(scalar="admin"),
        _exec_result(scalar=member_mock),
    ])
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
    mock_db.execute = AsyncMock(return_value=_exec_result(scalar="developer"))

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
    mock_db.execute = AsyncMock(return_value=_exec_result(scalar="admin"))

    response = await client.delete(
        f"/api/v1/projects/{project_id}/members/{owner_id}",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 403
    assert "owner" in response.json()["detail"].lower()
