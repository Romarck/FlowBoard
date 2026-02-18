"""Notification business logic."""
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.notifications.manager import manager
from app.notifications.models import Notification, NotificationType
from app.notifications.schemas import NotificationCreate, NotificationResponse


async def create_notification(db: AsyncSession, data: NotificationCreate) -> Notification:
    """Create a new notification and broadcast to user via WebSocket.

    Args:
        db: Database session.
        data: Notification creation data.

    Returns:
        The created Notification model instance.
    """
    notif = Notification(
        user_id=data.user_id,
        issue_id=data.issue_id,
        type=NotificationType(data.type),
        title=data.title,
        message=data.body,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)

    # Broadcast to user via WebSocket if connected
    response = NotificationResponse.model_validate(notif)
    await manager.send_to_user(str(data.user_id), {"type": "notification", "data": response.model_dump(mode="json")})

    return notif


async def get_notifications(
    db: AsyncSession, user_id: UUID, unread_only: bool = False, limit: int = 50
) -> list[Notification]:
    """Get notifications for a user, optionally filtered to unread only.

    Args:
        db: Database session.
        user_id: The user UUID.
        unread_only: If True, only return unread notifications.
        limit: Maximum number of notifications to return.

    Returns:
        List of Notification models, ordered by created_at descending.
    """
    query = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        query = query.where(Notification.read == False)

    query = query.order_by(Notification.created_at.desc()).limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_notification(db: AsyncSession, notification_id: UUID) -> Notification | None:
    """Get a single notification by ID.

    Args:
        db: Database session.
        notification_id: The notification UUID.

    Returns:
        The Notification model, or None if not found.
    """
    return await db.get(Notification, notification_id)


async def mark_read(db: AsyncSession, notification_id: UUID, user: User) -> Notification:
    """Mark a single notification as read.

    Args:
        db: Database session.
        notification_id: The notification UUID to mark as read.
        user: The current user (for permission check).

    Returns:
        The updated Notification model.

    Raises:
        HTTPException(404): If notification not found.
        HTTPException(403): If user doesn't own the notification.
    """
    notif = await db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(404, "Notification not found")

    if notif.user_id != user.id:
        raise HTTPException(403, "You can only mark your own notifications as read")

    notif.read = True
    await db.commit()
    await db.refresh(notif)
    return notif


async def mark_all_read(db: AsyncSession, user: User) -> int:
    """Mark all unread notifications as read for the current user.

    Args:
        db: Database session.
        user: The current user.

    Returns:
        The count of notifications marked as read.
    """
    result = await db.execute(
        update(Notification)
        .where(and_(Notification.user_id == user.id, Notification.read == False))
        .values(read=True)
        .returning(Notification.id)
    )
    await db.commit()
    return len(result.fetchall())


async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
    """Get count of unread notifications for a user.

    Args:
        db: Database session.
        user_id: The user UUID.

    Returns:
        The count of unread notifications.
    """
    result = await db.execute(
        select(Notification).where(and_(Notification.user_id == user_id, Notification.read == False))
    )
    return len(result.scalars().all())
