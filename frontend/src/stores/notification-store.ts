/**
 * Notification store — global state for unread count and notifications
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      unreadCount: 0,

      setUnreadCount: (count: number) => set({ unreadCount: count }),

      increment: () =>
        set((state) => ({
          unreadCount: state.unreadCount + 1,
        })),

      decrement: () =>
        set((state) => ({
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),

      reset: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'flowboard-notifications',
      partialize: (state) => ({
        unreadCount: state.unreadCount,
      }),
    }
  )
);
