"""Auth-specific test fixtures.

Overrides the root conftest's `client` fixture to preserve real auth
behavior (get_current_user is NOT bypassed), so tests for login, refresh,
/me, and token validation work correctly.
"""

import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock

from app.main import app


@pytest.fixture
async def client(mock_db):
    """Async HTTP test client with real auth (no get_current_user bypass)."""
    from app.database import get_db

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
