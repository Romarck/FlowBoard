/**
 * Notification hooks — queries, mutations, and WebSocket management
 */

import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import type { NotificationListResponse, WebSocketMessage } from '@/types/notification';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
};

/**
 * Query hook to fetch notifications for the current user
 */
export function useNotifications(unreadOnly: boolean = false, enabled: boolean = true) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationApi.list(unreadOnly),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Query hook to fetch unread notification count
 */
export function useUnreadCount(enabled: boolean = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    enabled,
    staleTime: 10 * 1000, // 10 seconds
  });
}

/**
 * Mutation hook to mark a single notification as read
 */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const decrement = useNotificationStore((s) => s.decrement);

  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      decrement();
    },
  });
}

/**
 * Mutation hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const reset = useNotificationStore((s) => s.reset);

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      reset();
    },
  });
}

/**
 * Effect hook to establish WebSocket connection and handle real-time notifications
 *
 * Automatically:
 * - Connects to WebSocket when user is authenticated
 * - Adds incoming notifications to React Query cache
 * - Updates unread count in Zustand store
 * - Disconnects on unmount
 * - Reconnects on token change
 */
export function useWebSocketNotifications() {
  const { user, token } = useAuthStore();
  const qc = useQueryClient();
  const increment = useNotificationStore((s) => s.increment);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !token) {
      // Close WS if user logs out
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsUrl = `${protocol}//${host.replace(/^https?:\/\//, '')}/ws/notifications?token=${token}`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('WebSocket connected for notifications');
          // Send initial ping to establish connection
          ws.send('ping');
        };

        ws.onmessage = (event) => {
          try {
            const msg: WebSocketMessage = JSON.parse(event.data);

            if (msg.type === 'notification' && msg.data) {
              // Add notification to React Query cache
              qc.setQueryData<NotificationListResponse>(notificationKeys.list(), (prev) => {
                if (!prev) return { items: [msg.data!], total: 1 };
                return {
                  items: [msg.data!, ...prev.items],
                  total: prev.total + 1,
                };
              });

              // Increment unread count if notification is unread
              if (!msg.data.read) {
                increment();
              }
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected for notifications');
          wsRef.current = null;

          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (e) {
        console.error('Failed to create WebSocket:', e);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, token, qc, increment]);
}
