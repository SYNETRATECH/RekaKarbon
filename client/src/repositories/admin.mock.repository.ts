import type { AdminRepository } from './admin.repository';
import type {
  AdminStats,
  AdminUserItem,
  AdminKybItem,
  QueryUsersParams,
  CreateUserPayload,
  ReviewKybPayload,
  UserRole,
  UserAccountStatus,
} from '../types/admin';
import { mockAdminUsers, mockAdminKyb, mockAdminStats } from '../lib/mock/admin';

export class MockAdminRepository implements AdminRepository {
  private users: AdminUserItem[] = [...mockAdminUsers];
  private kybList: AdminKybItem[] = [...mockAdminKyb];
  private stats: AdminStats = { ...mockAdminStats };

  async getStats(): Promise<AdminStats> {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter((u) => u.status === 'ACTIVE').length;
    const suspendedUsers = this.users.filter((u) => u.status === 'SUSPENDED').length;
    const pendingVerificationUsers = this.users.filter(
      (u) => u.status === 'PENDING_VERIFICATION'
    ).length;

    const roleCounts: Record<string, number> = {
      superadmin: 0,
      regulator: 0,
      auditor: 0,
      ministry: 0,
      emitter: 0,
      kth: 0,
      buyer: 0,
    };

    for (const u of this.users) {
      if (roleCounts[u.role] !== undefined) {
        roleCounts[u.role]++;
      } else {
        roleCounts[u.role] = 1;
      }
    }

    const pendingKybCount = this.kybList.filter((k) => k.verificationStatus === 'PENDING').length;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingVerificationUsers,
      roleCounts,
      pendingKybCount,
    };
  }

  async getUsers(params?: QueryUsersParams): Promise<{
    data: AdminUserItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    let filtered = [...this.users];

    if (params?.role) {
      filtered = filtered.filter((u) => u.role.toLowerCase() === params.role!.toLowerCase());
    }

    if (params?.status) {
      filtered = filtered.filter((u) => u.status === params.status);
    }

    if (params?.search && params.search.trim()) {
      const search = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          (u.fullName && u.fullName.toLowerCase().includes(search)) ||
          (u.agency && u.agency.toLowerCase().includes(search))
      );
    }

    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 10;
    const total = filtered.length;
    const skip = (page - 1) * limit;

    const paginated = filtered.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createUser(payload: CreateUserPayload): Promise<AdminUserItem> {
    const newUser: AdminUserItem = {
      id: `a1b2c3d4-e5f6-4a1b-8c2d-${String(this.users.length + 1).padStart(12, '0')}`,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role as UserRole,
      status: 'ACTIVE',
      agency: payload.agency,
      walletAddress: payload.walletAddress || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.unshift(newUser);
    return newUser;
  }

  async updateUserRole(userId: string, role: string): Promise<AdminUserItem> {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      role: role as UserRole,
      updatedAt: new Date().toISOString(),
    };

    return this.users[userIndex];
  }

  async updateUserStatus(userId: string, status: string): Promise<AdminUserItem> {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      status: status as UserAccountStatus,
      updatedAt: new Date().toISOString(),
    };

    return this.users[userIndex];
  }

  async resetPassword(userId: string): Promise<{ temporaryPassword: string; message: string }> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const temporaryPassword = `RekaKarbon#${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      temporaryPassword,
      message: `Kata sandi sementara untuk ${user.email} berhasil diterbitkan.`,
    };
  }

  async getKybSubmissions(): Promise<AdminKybItem[]> {
    return [...this.kybList];
  }

  async reviewKyb(kybId: string, payload: ReviewKybPayload): Promise<AdminKybItem> {
    const kybIndex = this.kybList.findIndex((k) => k.id === kybId);
    if (kybIndex === -1) {
      throw new Error('Profil KYB tidak ditemukan.');
    }

    this.kybList[kybIndex] = {
      ...this.kybList[kybIndex],
      verificationStatus: payload.status,
      verifiedAt: new Date().toISOString(),
    };

    // If verified, also activate the corresponding user in mock users
    if (payload.status === 'VERIFIED') {
      const userIndex = this.users.findIndex((u) => u.id === this.kybList[kybIndex].userId);
      if (userIndex !== -1) {
        this.users[userIndex] = {
          ...this.users[userIndex],
          status: 'ACTIVE',
        };
      }
    }

    return this.kybList[kybIndex];
  }
}
