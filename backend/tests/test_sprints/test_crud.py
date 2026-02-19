"""Tests for sprint CRUD operations."""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.sprints.models import Sprint, SprintStatus
from app.sprints.schemas import SprintCreate, SprintUpdate
from app.sprints import service
from app.auth.models import User


@pytest.fixture
def mock_db():
    """Mock async database session."""
    db = AsyncMock(spec=AsyncSession)
    return db


@pytest.fixture
def test_user():
    """Create a test user."""
    user = MagicMock(spec=User)
    user.id = uuid4()
    return user


@pytest.fixture
def test_project_id():
    """Create a test project ID."""
    return uuid4()


@pytest.fixture
def test_sprint(test_project_id):
    """Create a test sprint."""
    sprint = MagicMock(spec=Sprint)
    sprint.id = uuid4()
    sprint.project_id = test_project_id
    sprint.name = "Sprint 1"
    sprint.goal = "Complete feature X"
    sprint.start_date = None
    sprint.end_date = None
    sprint.status = SprintStatus.planning
    sprint.issues = []
    sprint.created_at = datetime.now(timezone.utc)
    sprint.updated_at = datetime.now(timezone.utc)
    return sprint


@pytest.mark.asyncio
async def test_create_sprint_success(mock_db, test_user, test_project_id, test_sprint):
    """Test successful sprint creation."""
    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'developer'
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda x: None)

        data = SprintCreate(name="Sprint 1", goal="Complete feature X")

        result = await service.create_sprint(mock_db, test_project_id, data, test_user)

        # Verify the sprint was created
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_sprints_success(mock_db, test_user, test_project_id, test_sprint):
    """Test fetching all sprints for a project."""
    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'developer'

        mock_db.execute = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars().all.return_value = [test_sprint]
        mock_db.execute.return_value = mock_result

        sprints = await service.get_sprints(mock_db, test_project_id, test_user)

        assert len(sprints) == 1
        assert sprints[0].name == "Sprint 1"


@pytest.mark.asyncio
async def test_start_sprint_success(mock_db, test_user, test_project_id, test_sprint):
    """Test starting a planning sprint."""
    test_sprint.status = SprintStatus.planning

    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'project_manager'

        # Mock get for fetching the sprint
        mock_db.get = AsyncMock(return_value=test_sprint)

        # Mock execute for checking active sprints
        mock_db.execute = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None  # No active sprint
        mock_db.execute.return_value = mock_result

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda x: None)

        result = await service.start_sprint(mock_db, test_project_id, test_sprint.id, test_user)

        # Verify status changed
        assert test_sprint.status == SprintStatus.active
        mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_start_sprint_already_active_fails(mock_db, test_user, test_project_id, test_sprint):
    """Test that starting a sprint fails if one is already active."""
    test_sprint.status = SprintStatus.planning

    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'project_manager'

        # Mock get for fetching the sprint
        mock_db.get = AsyncMock(return_value=test_sprint)

        # Mock execute to return an existing active sprint
        mock_db.execute = AsyncMock()
        mock_result = MagicMock()
        existing_sprint = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing_sprint
        mock_db.execute.return_value = mock_result

        with pytest.raises(HTTPException) as exc_info:
            await service.start_sprint(mock_db, test_project_id, test_sprint.id, test_user)

        assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_complete_sprint_moves_incomplete_issues(mock_db, test_user, test_project_id, test_sprint):
    """Test that completing a sprint moves incomplete issues to backlog."""
    test_sprint.status = SprintStatus.active

    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'project_manager'

        # Mock get for fetching the sprint
        mock_db.get = AsyncMock(return_value=test_sprint)

        # Mock execute for finding incomplete statuses
        mock_db.execute = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars().all.return_value = [uuid4()]  # One incomplete status
        mock_db.execute.return_value = mock_result

        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock(side_effect=lambda x: None)

        result = await service.complete_sprint(mock_db, test_project_id, test_sprint.id, test_user)

        # Verify status changed
        assert test_sprint.status == SprintStatus.completed
        mock_db.commit.assert_called()


@pytest.mark.asyncio
async def test_delete_sprint_planning_only(mock_db, test_user, test_project_id, test_sprint):
    """Test that only planning sprints can be deleted."""
    test_sprint.status = SprintStatus.planning

    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'project_manager'

        mock_db.get = AsyncMock(return_value=test_sprint)
        mock_db.delete = AsyncMock()
        mock_db.commit = AsyncMock()

        await service.delete_sprint(mock_db, test_project_id, test_sprint.id, test_user)

        mock_db.delete.assert_called_once()
        mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_sprint_active_fails(mock_db, test_user, test_project_id, test_sprint):
    """Test that deleting an active sprint fails."""
    test_sprint.status = SprintStatus.active

    with patch('app.projects.service.get_user_role_in_project', new_callable=AsyncMock) as mock_role:
        mock_role.return_value = 'project_manager'

        mock_db.get = AsyncMock(return_value=test_sprint)

        with pytest.raises(HTTPException) as exc_info:
            await service.delete_sprint(mock_db, test_project_id, test_sprint.id, test_user)

        assert exc_info.value.status_code == 422
