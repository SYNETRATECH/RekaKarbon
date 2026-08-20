export interface User {
  id: string; // UUIDv4
  email: string;
  passwordHash: string;
  createdAt: string; // ISO 8601
}

export type SafeUser = Omit<User, 'passwordHash'>;

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUserPayload;
}
