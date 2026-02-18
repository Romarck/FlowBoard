/**
 * Notification API client — REST endpoints for notifications
 */

import api from './client';
import type { Notification, NotificationListResponse, MarkReadResponse } from '@/types/notification';

export const notificationApi = {
  /**
   * List notifications for the current user
   * @param unreadOnly If true, only return unread notifications
   * @param limit Maximum number of notifications to return
   */
  list: (unreadOnly: boolean = false, limit: number = 50): Promise<NotificationListResponse> =>
    api.get('/api/v1/notifications', { params: { unread_only: unreadOnly, limit } }).then(r => r.data),

  /**
   * Get count of unread notifications
   */
  getUnreadCount: (): Promise<{ count: number }> =>
    api.get('/api/v1/notifications/unread-count').then(r => r.data),

  /**
   * Mark a single notification as read
   * @param id Notification UUID
   */
  markRead: (id: string): Promise<Notification> =>
    api.patch(`/api/v1/notifications/${id}/read`).then(r => r.data),

  /**
   * Mark all unread notifications as read
   */
  markAllRead: (): Promise<MarkReadResponse> =>
    api.post('/api/v1/notifications/read-all').then(r => r.data),
};
