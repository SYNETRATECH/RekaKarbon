import { api } from '../lib/api';
import type { MockUser, AuthCredentials, AuthResponse } from '../types';

export interface AuthRepository {
  login(credentials: AuthCredentials): Promise<AuthResponse>;
  register(data: any): Promise<AuthResponse>;
  getCurrentUser(): Promise<MockUser | null>;
  logout(): Promise<{ success: boolean }>;
}

export class ApiAuthRepository implements AuthRepository {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    const token = res?.token || res?.accessToken;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('rekakarbon_token', token);
    }
    return res;
  }

  async register(data: any): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  }

  async getCurrentUser(): Promise<MockUser | null> {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('rekakarbon_token');
    if (!token) return null;

    try {
      return await api.get<MockUser>('/auth/me');
    } catch {
      localStorage.removeItem('rekakarbon_token');
      return null;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rekakarbon_token');
    }
    try {
      await api.post<{ success: boolean }>('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    }
    return { success: true };
  }
}

export const authRepository: AuthRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./auth.mock.repository')).MockAuthRepository()
    : new ApiAuthRepository();
