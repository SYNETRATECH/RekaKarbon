import { mockUsers, MockUser } from '../lib/mock/auth';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface AuthCredentials {
  identity?: string;
  password?: string;
  verichainKey?: string;
  role?: string;
}

export interface AuthResponse {
  user: MockUser;
  token: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'kth';
}

export interface AuthRepository {
  login(credentials: AuthCredentials): Promise<AuthResponse>;
  register(data: any): Promise<AuthResponse>;
  getCurrentUser(): Promise<MockUser | null>;
  logout(): Promise<{ success: boolean }>;
}

class MockAuthRepository implements AuthRepository {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    // Find matching user by email or role
    let user = Object.values(mockUsers).find(
      (u) => u.email.toLowerCase() === credentials.identity?.toLowerCase()
    );

    if (!user) {
      const roleKey = (credentials.role || 'emitter') as keyof typeof mockUsers;
      user = mockUsers[roleKey] || mockUsers.emitter;
    }

    // Simulating token store
    localStorage.setItem('rekakarbon_auth_token', user.token);
    localStorage.setItem('rekakarbon_user_role', user.role);

    return {
      user,
      token: user.token,
      role: user.role,
    };
  }

  async register(data: any): Promise<AuthResponse> {
    const roleKey = (data.role || 'emitter') as keyof typeof mockUsers;
    const baseUser = mockUsers[roleKey] || mockUsers.emitter;
    const newUser: MockUser = {
      ...baseUser,
      email: data.identity || data.email || baseUser.email,
      name: data.name || baseUser.name,
    };

    localStorage.setItem('rekakarbon_auth_token', newUser.token);
    localStorage.setItem('rekakarbon_user_role', newUser.role);

    return {
      user: newUser,
      token: newUser.token,
      role: newUser.role,
    };
  }

  async getCurrentUser(): Promise<MockUser | null> {
    const savedRole = localStorage.getItem('rekakarbon_user_role');
    if (savedRole && mockUsers[savedRole]) {
      return mockUsers[savedRole];
    }
    return null;
  }

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem('rekakarbon_auth_token');
    localStorage.removeItem('rekakarbon_user_role');
    return { success: true };
  }
}

class ApiAuthRepository implements AuthRepository {
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

export const authRepository: AuthRepository = useMock
  ? new MockAuthRepository()
  : new ApiAuthRepository();
