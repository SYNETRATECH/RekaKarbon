export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  roleTitle?: string;
  agency?: string;
  avatar?: string;
  token?: string;
  walletAddress?: string;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  accessToken?: string;
  role: string;
}
