import type { AuthRepository } from './auth.repository';
import { mockUsers } from '../lib/mock/auth';
import type { User, AuthCredentials, AuthResponse } from '../types';

export class MockAuthRepository implements AuthRepository {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    let user = Object.values(mockUsers).find(
      (u) => u.email.toLowerCase() === credentials.email?.toLowerCase()
    );

    if (!user) {
      throw new Error(
        'Kredensial tidak valid. Gunakan akun demo yang tersedia di tombol Quick Login.'
      );
    }

    const token = user.token || 'mock_jwt_token';
    localStorage.setItem('rekakarbon_auth_token', token);
    localStorage.setItem('rekakarbon_user_role', user.role);
    localStorage.setItem('rekakarbon_user_profile', JSON.stringify(user));

    return {
      user,
      token,
      role: user.role,
    };
  }

  async register(data: any): Promise<AuthResponse> {
    const roleKey = (data.role || 'emitter') as keyof typeof mockUsers;
    const baseUser = mockUsers[roleKey] || mockUsers.emitter;
    const newUser: User = {
      ...baseUser,
      email: data.identity || data.email || baseUser.email,
      name: data.name || baseUser.name,
    };

    const token = newUser.token || 'mock_jwt_token';
    localStorage.setItem('rekakarbon_auth_token', token);
    localStorage.setItem('rekakarbon_user_role', newUser.role);
    localStorage.setItem('rekakarbon_user_profile', JSON.stringify(newUser));

    return {
      user: newUser,
      token,
      role: newUser.role,
    };
  }

  async getCurrentUser(): Promise<User | null> {
    const savedProfileStr = localStorage.getItem('rekakarbon_user_profile');
    if (savedProfileStr) {
      try {
        return JSON.parse(savedProfileStr);
      } catch (e) {
        // Fallback
      }
    }
    const savedRole = localStorage.getItem('rekakarbon_user_role');
    if (savedRole && mockUsers[savedRole]) {
      return mockUsers[savedRole];
    }
    return null;
  }

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem('rekakarbon_auth_token');
    localStorage.removeItem('rekakarbon_user_role');
    localStorage.removeItem('rekakarbon_user_profile');
    return { success: true };
  }
}
