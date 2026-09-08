export type UserRole =
  'superadmin' | 'admin' | 'regulator' | 'auditor' | 'ministry' | 'emitter' | 'kth' | 'buyer';

export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface RoleBadgeStyle {
  bg: string;
  text: string;
  border: string;
}

export interface RoleDefinition {
  code: UserRole;
  label: string;
  category: string;
  description: string;
  badgeStyle: RoleBadgeStyle;
  isAssignable: boolean;
}

export interface AdminUserItem {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  status: UserAccountStatus;
  agency?: string | null;
  walletAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingVerificationUsers: number;
  roleCounts: Record<string, number>;
  pendingKybCount: number;
}

export interface AdminKybItem {
  id: string;
  userId: string;
  entityName: string;
  category: 'CORPORATE' | 'KTH_COOPERATIVE' | 'VERIFIER_INSTITUTION' | 'GOVERNMENT_AGENCY';
  npwp?: string | null;
  registrationNumber?: string | null;
  signatoryName?: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string | null;
  createdAt: string;
  userEmail: string;
  userFullName?: string | null;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName?: string;
  role: string;
  agency?: string;
  walletAddress?: string;
}

export interface ReviewKybPayload {
  status: 'VERIFIED' | 'REJECTED';
  notes?: string;
}
