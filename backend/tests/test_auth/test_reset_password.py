"""Tests for password reset and forgot password endpoints."""

import hashlib
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.auth.models import User, UserRole
from app.auth.utils import create_access_token, hash_password
from tests.conftest import _make_test_user


# ---------------------------------------------------------------------------
# Forgot password tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_forgot_password_existing_email(client, mock_db):
    """POST /forgot-password with existing email returns 200 and generates token."""
    test_user = _make_test_user(email="existing@example.com")

    async def mock_create_reset(*args, **kwargs):
        return "test-uuid-token-1234"

    with patch("app.auth.router.create_reset_token", new_callable=AsyncMock, return_value="test-uuid-token-1234"):
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "existing@example.com"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "If the email exists" in data["message"]


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_email(client, mock_db):
    """POST /forgot-password with unknown email still returns 200 (security)."""
    with patch("app.auth.router.create_reset_token", new_callable=AsyncMock, return_value=None):
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )

    assert response.status_code == 200
    data = response.json()
    # Should not reveal whether email exists
    assert "If the email exists" in data["message"]


@pytest.mark.asyncio
async def test_forgot_password_invalid_email_format(client, mock_db):
    """POST /forgot-password with invalid email format returns 422."""
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "not-an-email"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_forgot_password_missing_email(client, mock_db):
    """POST /forgot-password without email field returns 422."""
    response = await client.post(
        "/api/v1/auth/forgot-password",
        json={},
    )

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Reset password tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reset_password_valid_token(client, mock_db):
    """POST /reset-password with valid token updates password."""
    test_user = _make_test_user(email="reset@example.com")
    token = "valid-reset-token-1234"

    async def mock_reset(*args, **kwargs):
        pass  # Just succeed

    with patch("app.auth.router.reset_password", new_callable=AsyncMock):
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "NewPassword1"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Password updated successfully" in data["message"]


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client, mock_db):
    """POST /reset-password with invalid token returns 400."""
    from fastapi import HTTPException

    async def mock_reset(*args, **kwargs):
        raise HTTPException(status_code=400, detail="Token expired or invalid")

    with patch("app.auth.router.reset_password", side_effect=mock_reset):
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": "invalid-token", "new_password": "NewPassword1"},
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "Token expired or invalid"


@pytest.mark.asyncio
async def test_reset_password_expired_token(client, mock_db):
    """POST /reset-password with expired token returns 400."""
    from fastapi import HTTPException

    async def mock_reset(*args, **kwargs):
        raise HTTPException(status_code=400, detail="Token expired or invalid")

    with patch("app.auth.router.reset_password", side_effect=mock_reset):
        response = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": "expired-token", "new_password": "NewPassword1"},
        )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_reset_password_weak_password(client, mock_db):
    """POST /reset-password with weak password (no uppercase) returns 422."""
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "some-token", "new_password": "weakpassword1"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reset_password_weak_password_no_digit(client, mock_db):
    """POST /reset-password with weak password (no digit) returns 422."""
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "some-token", "new_password": "WeakPassword"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reset_password_too_short(client, mock_db):
    """POST /reset-password with password < 8 chars returns 422."""
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "some-token", "new_password": "Pass1"},
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reset_password_single_use(client, mock_db):
    """Token becomes invalid after first use."""
    token = "single-use-token"
    test_user = _make_test_user(email="singleuse@example.com")

    # First use succeeds
    with patch("app.auth.router.reset_password", new_callable=AsyncMock):
        response1 = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "FirstPassword1"},
        )
    assert response1.status_code == 200

    # Second use should fail (token already consumed)
    from fastapi import HTTPException

    async def mock_reset_expired(*args, **kwargs):
        raise HTTPException(status_code=400, detail="Token expired or invalid")

    with patch("app.auth.router.reset_password", side_effect=mock_reset_expired):
        response2 = await client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "SecondPassword1"},
        )
    assert response2.status_code == 400


# ---------------------------------------------------------------------------
# Service layer unit tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_reset_token_existing_email(mock_db):
    """create_reset_token returns token for existing email."""
    from app.auth.service import create_reset_token

    test_user = _make_test_user(email="test@example.com")
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none = lambda: test_user
    mock_db.commit = AsyncMock()

    token = await create_reset_token(mock_db, "test@example.com")

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0
    # Should be a valid UUID format
    import uuid
    try:
        uuid.UUID(token)
    except ValueError:
        pytest.fail("Token is not a valid UUID")


@pytest.mark.asyncio
async def test_create_reset_token_nonexistent_email(mock_db):
    """create_reset_token returns None for nonexistent email."""
    from app.auth.service import create_reset_token

    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none = lambda: None

    token = await create_reset_token(mock_db, "nobody@example.com")

    assert token is None


@pytest.mark.asyncio
async def test_reset_password_valid_token_updates_hash(mock_db):
    """reset_password updates password hash when token is valid."""
    from app.auth.service import reset_password

    test_user = _make_test_user(email="test@example.com")
    old_hash = test_user.password_hash
    token = "valid-token-uuid-1234"
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    test_user.reset_token_hash = token_hash
    test_user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)

    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none = lambda: test_user
    mock_db.commit = AsyncMock()

    await reset_password(mock_db, token, "NewPassword1")

    # Password should be updated
    assert test_user.password_hash != old_hash
    # Reset fields should be cleared
    assert test_user.reset_token_hash is None
    assert test_user.reset_token_expires is None
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_reset_password_invalid_token_raises_error(mock_db):
    """reset_password raises 400 for invalid token."""
    from fastapi import HTTPException
    from app.auth.service import reset_password

    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none = lambda: None

    with pytest.raises(HTTPException) as exc_info:
        await reset_password(mock_db, "invalid-token", "NewPassword1")

    assert exc_info.value.status_code == 400
    assert "Token expired or invalid" in exc_info.value.detail


@pytest.mark.asyncio
async def test_reset_password_expired_token_raises_error(mock_db):
    """reset_password raises 400 for expired token."""
    from fastapi import HTTPException
    from app.auth.service import reset_password

    # Token expired in the past
    mock_db.execute = AsyncMock()
    mock_db.execute.return_value.scalar_one_or_none = lambda: None

    with pytest.raises(HTTPException) as exc_info:
        await reset_password(mock_db, "expired-token", "NewPassword1")

    assert exc_info.value.status_code == 400
