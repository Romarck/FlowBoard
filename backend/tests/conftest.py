"""Shared test fixtures for FlowBoard backend tests."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.auth.models import UserRole
from app.auth.utils import create_access_token, create_refresh_token, hash_password
from app.main import app


def _make_test_user(
    user_id: str | None = None,
    email: str = "test@example.com",
    name: str = "Test User",
    password: str = "TestPass1",
    role: UserRole = UserRole.developer,
    is_active: bool = True,
) -> MagicMock:
    """Create a mock User object for testing (avoids SQLAlchemy mapper issues).

    Returns a MagicMock that behaves like a User model instance.
    """
    user = MagicMock()
    user.id = uuid.UUID(user_id) if user_id else uuid.uuid4()
    user.email = email
    user.name = name
    user.password_hash = hash_password(password)
    user.avatar_url = None
    user.role = role
    user.is_active = is_active
    user.created_at = datetime.now(timezone.utc)
    user.updated_at = datetime.now(timezone.utc)
    return user


@pytest.fixture
def test_user():
    """A default test user with known credentials."""
    return _make_test_user()


@pytest.fixture
def test_user_tokens(test_user):
    """Generate access and refresh tokens for the test user."""
    access = create_access_token(str(test_user.id), test_user.role.value)
    refresh = create_refresh_token(str(test_user.id))
    return {"access_token": access, "refresh_token": refresh}


@pytest.fixture
def mock_db():
    """Create a mock async database session.

    Uses MagicMock for return values of async operations so that
    synchronous chaining (e.g. result.scalars().all()) works correctly.
    AsyncMock return values are themselves AsyncMock, which makes .scalars()
    return a coroutine instead of a MagicMock -- breaking the chain.
    """
    session = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.rollback = AsyncMock()

    # db.execute() is awaited, but its return value is used synchronously
    # (e.g. result.scalars().all(), result.scalar_one_or_none()).
    # Set return_value to MagicMock to enable synchronous chaining.
    execute_result = MagicMock()
    session.execute = AsyncMock(return_value=execute_result)

    # db.scalar() returns a value directly
    session.scalar = AsyncMock(return_value=0)

    return session


@pytest.fixture
async def client(mock_db, test_user):
    """Async HTTP test client with auth bypassed.

    Overrides get_current_user so that tests for non-auth endpoints
    (projects, issues, sprints, etc.) don't need to worry about the auth
    layer intercepting db.get calls for User lookups.

    Auth-specific tests override this fixture in their own conftest.py
    to preserve the real auth behavior.
    """
    from app.auth.dependencies import get_current_user
    from app.database import get_db

    async def override_get_db():
        yield mock_db

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
