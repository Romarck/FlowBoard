"""Notifications API router — REST endpoints and WebSocket."""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.utils import decode_token
from app.database import get_db
from app.notifications import schemas, service
from app.notifications.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["notifications"])


@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """WebSocket endpoint for real-time notifications.

    Expects a query parameter 'token' with a valid JWT access token.
    The connection is kept alive by sending/receiving ping-pong frames.

    Args:
        websocket: The WebSocket connection.
        token: JWT access token passed as query param.
        db: Database session.
    """
    user_id = None
    try:
        # Decode JWT token from query param
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return

        # Accept and register the connection
        await manager.connect(websocket, user_id)

        # Keep the connection alive; client will send ping-pong
        while True:
            data = await websocket.receive_text()
            # Echo back pings (simple keep-alive mechanism)
            if data == "ping":
                await websocket.send_text("pong")

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        try:
            await websocket.close(code=1011, reason=str(e))
        except Exception:
            pass
    finally:
        if user_id:
            manager.disconnect(websocket, user_id)


@router.get("/notifications", response_model=schemas.NotificationListResponse)
async def list_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> schemas.NotificationListResponse:
    """Get notifications for the current user.

    Args:
        unread_only: If true, return only unread notifications.
        limit: Maximum number of notifications to return (1-100).
        db: Database session.
        user: Current authenticated user.

    Returns:
        List of notifications with total count.
    """
    notifications = await service.get_notifications(db, user.id, unread_only=unread_only, limit=limit)
    return schemas.NotificationListResponse(
        items=[schemas.NotificationResponse.model_validate(n) for n in notifications],
        total=len(notifications),
    )


@router.get("/notifications/unread-count", response_model=dict)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    """Get count of unread notifications.

    Args:
        db: Database session.
        user: Current authenticated user.

    Returns:
        Dictionary with 'count' key.
    """
    count = await service.get_unread_count(db, user.id)
    return {"count": count}


@router.patch("/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> schemas.NotificationResponse:
    """Mark a single notification as read.

    Args:
        notification_id: The notification UUID.
        db: Database session.
        user: Current authenticated user.

    Returns:
        Updated notification.

    Raises:
        HTTPException(404): If notification not found.
        HTTPException(403): If user doesn't own the notification.
    """
    notif = await service.mark_read(db, notification_id, user)
    return schemas.NotificationResponse.model_validate(notif)


@router.post("/notifications/read-all", response_model=schemas.MarkReadResponse)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> schemas.MarkReadResponse:
    """Mark all unread notifications as read.

    Args:
        db: Database session.
        user: Current authenticated user.

    Returns:
        Count of notifications marked as read.
    """
    count = await service.mark_all_read(db, user)
    return schemas.MarkReadResponse(count=count)
