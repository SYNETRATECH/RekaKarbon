import { Role, UserStatus, KybStatus, KybCategory } from '@prisma/client';

export interface AdminUserItem {
  id: string;
  email: string;
  fullName?: string;
  role: Role;
  status: UserStatus;
  agency?: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingVerificationUsers: number;
  roleCounts: Record<Role, number>;
  pendingKybCount: number;
}

export interface AdminKybItem {
  id: string;
  userId: string;
  entityName: string;
  category: KybCategory;
  npwp?: string | null;
  registrationNumber?: string | null;
  signatoryName?: string | null;
  verificationStatus: KybStatus;
  verifiedAt?: string | null;
  createdAt: string;
  userEmail: string;
  userFullName?: string | null;
}
