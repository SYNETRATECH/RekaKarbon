export interface MockUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'kth';
  roleTitle: string;
  agency: string;
  avatar: string;
  verichainKey: string;
  token: string;
}

export interface AuthCredentials {
  identity?: string;
  email?: string;
  password?: string;
  verichainKey?: string;
  role?: string;
}

export interface AuthResponse {
  user: MockUser;
  token: string;
  role: 'emitter' | 'regulator' | 'auditor' | 'kth';
}
