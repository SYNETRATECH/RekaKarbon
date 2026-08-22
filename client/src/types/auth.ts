export interface MockUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'kth';
  roleTitle: string;
  agency: string;
  avatar: string;
  token: string;
}

export interface AuthCredentials {
  identity?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface AuthResponse {
  user: MockUser;
  token: string;
  accessToken?: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'kth';
}
