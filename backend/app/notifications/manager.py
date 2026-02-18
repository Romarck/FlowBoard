"""WebSocket connection manager for real-time notifications."""
from collections import defaultdict
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections per user for real-time notifications.

    Supports multiple concurrent connections per user (e.g., multiple tabs/windows).
    """

    def __init__(self):
        """Initialize connection manager with empty connections dict."""
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Accept and register a WebSocket connection.

        Args:
            websocket: The WebSocket connection to accept.
            user_id: The user UUID as string who owns this connection.
        """
        await websocket.accept()
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Unregister and remove a WebSocket connection.

        Args:
            websocket: The WebSocket connection to remove.
            user_id: The user UUID as string who owns this connection.
        """
        if websocket in self.active_connections.get(user_id, []):
            self.active_connections[user_id].remove(websocket)
            logger.info(f"User {user_id} disconnected. Remaining connections: {len(self.active_connections[user_id])}")

    async def send_to_user(self, user_id: str, data: dict) -> None:
        """Send a JSON message to all connections of a user.

        Silently skips connections that have been closed.

        Args:
            user_id: The user UUID as string to send the message to.
            data: Dictionary to send as JSON to the user's connections.
        """
        for ws in self.active_connections.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception as e:
                logger.debug(f"Error sending to user {user_id}: {e}")
                # Connection may have closed; we don't remove it here
                # It will be removed on next disconnect() call


# Singleton instance used across the app
manager = ConnectionManager()
