import api from '@/api/client';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
} from '@/types/auth';

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<User>('/api/v1/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/api/v1/auth/login', data),

  refreshToken: () =>
    api.post<TokenResponse>('/api/v1/auth/refresh'),

  getMe: () =>
    api.get<User>('/api/v1/auth/me'),

  updateMe: (data: Partial<Pick<User, 'name' | 'avatar_url'>>) =>
    api.patch<User>('/api/v1/auth/me', data),

  logout: () =>
    api.post('/api/v1/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/api/v1/auth/forgot-password', { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post('/api/v1/auth/reset-password', { token, new_password }),
};
