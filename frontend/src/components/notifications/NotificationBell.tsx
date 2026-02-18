/**
 * NotificationBell — Bell icon with unread count badge and dropdown popover with notifications list
 */

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { useNotificationStore } from '@/stores/notification-store';
import { NotificationItem } from './NotificationItem';

interface NotificationBellProps {
  projectId?: string;
}

export function NotificationBell({ projectId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { data: notificationsData, isLoading } = useNotifications(false, true);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = async (id: string) => {
    markRead.mutate(id);
  };

  const handleMarkAllRead = async () => {
    markAllRead.mutate();
  };

  const handleNotificationClick = (issueId: string | null) => {
    if (issueId && projectId) {
      // Navigate to issue detail (would require React Router)
      console.log('Navigate to issue:', issueId);
    }
    setIsOpen(false);
  };

  const notifications = notificationsData?.items || [];

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 h-5 w-5 rounded-full bg-red-500 text-xs font-semibold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onClick={() => handleNotificationClick(notification.issue_id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              <button
                disabled
                className="w-full text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 disabled:opacity-50"
                title="Coming in next version"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
