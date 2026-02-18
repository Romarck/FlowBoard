"""Tests for the /health endpoint."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint_db_connected():
    """Health check returns 'ok' and 'connected' when database is reachable."""
    mock_session = AsyncMock()
    mock_session.execute = AsyncMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)

    with patch("app.main.async_session", return_value=mock_session):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["db"] == "connected"


@pytest.mark.asyncio
async def test_health_endpoint_db_disconnected():
    """Health check returns 'degraded' and 'disconnected' when database is unreachable."""
    mock_session = AsyncMock()
    mock_session.execute = AsyncMock(side_effect=Exception("Connection refused"))
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=False)

    with patch("app.main.async_session", return_value=mock_session):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["db"] == "disconnected"
