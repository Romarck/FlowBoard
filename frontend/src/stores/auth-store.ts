import { create } from 'zustand';
import type { User } from '@/types/auth';

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) =>
    set({
      token,
      user,
      isAuthenticated: true,
    }),

  setUser: (user) => set({ user }),

  logout: () =>
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    }),
}));
