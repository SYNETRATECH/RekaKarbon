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
    return api.post<AuthResponse>('/auth/login', credentials);
  }

  async register(data: any): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/register', data);
  }

  async getCurrentUser(): Promise<MockUser | null> {
    return api.get<MockUser>('/auth/me');
  }

  async logout(): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>('/auth/logout', {});
  }
}

export const authRepository: AuthRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./auth.mock.repository')).MockAuthRepository()
    : new ApiAuthRepository();
