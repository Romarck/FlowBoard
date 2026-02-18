"""Tests for login, refresh, /me, and logout endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.models import User, UserRole
from app.auth.utils import create_access_token, create_refresh_token, hash_password
from app.main import app
from tests.conftest import _make_test_user


# ---------------------------------------------------------------------------
# Login tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_success(client, mock_db, test_user):
    """POST /login with valid credentials returns access_token."""
    # Mock authenticate_user to return our test user
    with patch("app.auth.router.authenticate_user", new_callable=AsyncMock, return_value=test_user):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "TestPass1"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # Refresh token should be set as httpOnly cookie
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_invalid_email(client, mock_db):
    """POST /login with unknown email returns 401."""
    with patch("app.auth.router.authenticate_user", new_callable=AsyncMock, return_value=None):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@example.com", "password": "WrongPass1"},
        )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_wrong_password(client, mock_db):
    """POST /login with wrong password returns 401."""
    with patch("app.auth.router.authenticate_user", new_callable=AsyncMock, return_value=None):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "WrongPass1"},
        )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_inactive_user(client, mock_db):
    """POST /login with inactive user raises 403 from service layer."""
    from fastapi import HTTPException

    async def mock_auth(*args, **kwargs):
        raise HTTPException(status_code=403, detail="Account is inactive")

    with patch("app.auth.router.authenticate_user", side_effect=mock_auth):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "inactive@example.com", "password": "TestPass1"},
        )

    assert response.status_code == 403
    assert response.json()["detail"] == "Account is inactive"


# ---------------------------------------------------------------------------
# Refresh token tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_refresh_token_success(client, mock_db, test_user, test_user_tokens):
    """POST /refresh with valid refresh cookie returns new access_token."""
    mock_db.get = AsyncMock(return_value=test_user)

    response = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": test_user_tokens["refresh_token"]},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_refresh_token_missing(client, mock_db):
    """POST /refresh without cookie returns 401."""
    response = await client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token missing"


@pytest.mark.asyncio
async def test_refresh_token_invalid(client, mock_db):
    """POST /refresh with invalid token returns 401."""
    response = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": "not-a-valid-token"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_with_access_token_rejected(client, mock_db, test_user):
    """POST /refresh with an access token (not refresh) is rejected."""
    access_token = create_access_token(str(test_user.id), test_user.role.value)

    response = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": access_token},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token type"


# ---------------------------------------------------------------------------
# /me endpoint tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_me_authenticated(client, mock_db, test_user, test_user_tokens):
    """GET /me with valid token returns user data."""
    mock_db.get = AsyncMock(return_value=test_user)

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name
    assert data["role"] == test_user.role.value


@pytest.mark.asyncio
async def test_get_me_no_token(client, mock_db):
    """GET /me without token returns 401."""
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client, mock_db):
    """GET /me with invalid token returns 401."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token-here"},
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_patch_me_update_name(client, mock_db, test_user, test_user_tokens):
    """PATCH /me updates user name."""
    mock_db.get = AsyncMock(return_value=test_user)

    async def mock_refresh(user):
        user.name = "Updated Name"

    mock_db.refresh = mock_refresh

    response = await client.patch(
        "/api/v1/auth/me",
        json={"name": "Updated Name"},
        headers={"Authorization": f"Bearer {test_user_tokens['access_token']}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


# ---------------------------------------------------------------------------
# Logout test
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_logout(client, mock_db):
    """POST /logout clears refresh cookie."""
    response = await client.post("/api/v1/auth/logout")

    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out"


# ---------------------------------------------------------------------------
# Integration-style test: register -> login -> /me -> refresh -> /me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_login_me_refresh_flow(client, mock_db):
    """Full auth flow: register, login, access /me, refresh, access /me again."""
    import uuid
    from datetime import datetime, timezone

    from app.auth.models import User, UserRole
    from app.auth.utils import hash_password

    new_user = _make_test_user(
        email="flow@example.com",
        name="Flow User",
        password="FlowPass1",
    )

    # Step 1: Register
    with patch("app.auth.router.register_user", new_callable=AsyncMock, return_value=new_user):
        reg_resp = await client.post(
            "/api/v1/auth/register",
            json={"email": "flow@example.com", "name": "Flow User", "password": "FlowPass1"},
        )
    assert reg_resp.status_code == 201

    # Step 2: Login
    with patch("app.auth.router.authenticate_user", new_callable=AsyncMock, return_value=new_user):
        login_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "flow@example.com", "password": "FlowPass1"},
        )
    assert login_resp.status_code == 200
    access_token = login_resp.json()["access_token"]
    refresh_cookie = login_resp.cookies.get("refresh_token")

    # Step 3: Access /me
    mock_db.get = AsyncMock(return_value=new_user)
    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "flow@example.com"

    # Step 4: Refresh
    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_cookie},
    )
    assert refresh_resp.status_code == 200
    new_access = refresh_resp.json()["access_token"]

    # Step 5: Access /me with refreshed token
    me2_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {new_access}"},
    )
    assert me2_resp.status_code == 200
    assert me2_resp.json()["email"] == "flow@example.com"
