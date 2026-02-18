/**
 * NotificationItem — Individual notification list item with icon, title, body, and timestamp
 */

import { Bell, User, CheckCircle, MessageCircle } from 'lucide-react';
import type { Notification, NotificationType } from '@/types/notification';
import { formatRelativeTime } from '@/utils/date';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: () => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  assigned: <User className="h-5 w-5 text-blue-500" />,
  mentioned: <Bell className="h-5 w-5 text-orange-500" />,
  status_changed: <CheckCircle className="h-5 w-5 text-green-500" />,
  commented: <MessageCircle className="h-5 w-5 text-purple-500" />,
};

export function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read && onMarkRead) {
      onMarkRead(notification.id);
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left border-b border-gray-200 px-3 py-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50 transition-colors ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{NOTIFICATION_ICONS[notification.type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={`text-sm ${
              !notification.read
                ? 'font-semibold text-gray-900 dark:text-white'
                : 'font-medium text-gray-700 dark:text-gray-300'
            }`}
          >
            {notification.title}
          </p>

          {/* Body/Preview */}
          {notification.body && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
              {notification.body}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>

        {/* Unread indicator dot */}
        {!notification.read && (
          <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1" />
        )}
      </div>
    </button>
  );
}
