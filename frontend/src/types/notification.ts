/**
 * Notification types and interfaces
 */

export type NotificationType = 'assigned' | 'mentioned' | 'status_changed' | 'commented';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  issue_id: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
}

export interface MarkReadResponse {
  count: number;
}

export interface WebSocketMessage {
  type: string;
  data?: Notification;
}
