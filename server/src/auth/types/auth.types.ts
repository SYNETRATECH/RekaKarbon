import { Role } from '@prisma/client';

export interface User {
  id: string; // UUIDv4
  email: string;
  passwordHash: string;
  fullName?: string;
  role: Role;
  agency?: string;
  walletAddress?: string;
  createdAt: string; // ISO 8601
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  agency?: string;
  walletAddress?: string;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: Role;
  walletAddress?: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUserPayload;
}
