import type { AdminRepository } from './admin.repository';
import type {
  AdminStats,
  AdminUserItem,
  AdminKybItem,
  RoleDefinition,
  QueryUsersParams,
  CreateUserPayload,
  ReviewKybPayload,
  UserRole,
  UserAccountStatus,
} from '../types/admin';
import { mockAdminUsers, mockAdminKyb, mockAdminStats } from '../lib/mock/admin';

export const MOCK_ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: 'emitter',
    label: 'Pelaku Usaha (Emitter)',
    category: 'Industri & Energi',
    description:
      'Entitas usaha wajib pajak karbon, pemegang alokasi kuota emisi PTBAE-PU, dan pelapor MRV.',
    badgeStyle: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
    },
    isAssignable: true,
  },
  {
    code: 'kth',
    label: 'Kelompok Tani Hutan (KTH)',
    category: 'Kehutanan & Komunitas',
    description:
      'Kelompok pengelola perhutanan sosial, pemilik proyek karbon berbasis alam, dan penerima insentif.',
    badgeStyle: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
    isAssignable: true,
  },
  {
    code: 'auditor',
    label: 'Auditor Independen (Sucofindo / Verifier)',
    category: 'Verifikasi & Audit',
    description:
      'Lembaga verifikasi independen terakreditasi untuk inspeksi lapangan, telemetri drone, dan audit emisi.',
    badgeStyle: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    isAssignable: true,
  },
  {
    code: 'regulator',
    label: 'Regulator Lingkungan (KLHK)',
    category: 'Pemerintah & Regulator',
    description:
      'Otoritas verifikasi nasional SRN-PPI, penerbit sertifikat SPE-GRK, dan pengawas kepatuhan lingkungan.',
    badgeStyle: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    isAssignable: true,
  },
  {
    code: 'ministry',
    label: 'Kementerian Sektoral (ESDM PTBAE)',
    category: 'Kementerian Energi',
    description:
      'Pemberi persetujuan teknis alokasi kuota batas atas emisi pembangkit dan industri sektoral.',
    badgeStyle: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    isAssignable: true,
  },
  {
    code: 'buyer',
    label: 'Pembeli Karbon Terdaftar (Buyer)',
    category: 'Pasar & Perdagangan',
    description:
      'Entitas atau korporasi pembeli kredit karbon tersertifikasi untuk penyeimbangan emisi (offseting).',
    badgeStyle: {
      bg: 'bg-teal-100',
      text: 'text-teal-800',
      border: 'border-teal-200',
    },
    isAssignable: true,
  },
  {
    code: 'superadmin',
    label: 'Super Administrator',
    category: 'Manajemen Sistem',
    description:
      'Administrator sistem penuh dengan hak pengelolaan akun pengguna, verifikasi KYB, dan konfigurasi platform.',
    badgeStyle: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-200',
    },
    isAssignable: true,
  },
];

export class MockAdminRepository implements AdminRepository {
  private users: AdminUserItem[] = [...mockAdminUsers];
  private kybList: AdminKybItem[] = [...mockAdminKyb];
  private stats: AdminStats = { ...mockAdminStats };

  async getRoles(): Promise<RoleDefinition[]> {
    return [...MOCK_ROLE_DEFINITIONS];
  }

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

    const user = this.users[userIndex];
    if (user.role === 'superadmin' && role !== 'superadmin') {
      const superadminCount = this.users.filter(
        (u) => u.role === 'superadmin' && u.status === 'ACTIVE'
      ).length;
      if (superadminCount <= 1) {
        throw new Error(
          'Tidak dapat menurunkan peran Superadmin terakhir. Platform harus memiliki minimal satu Superadmin aktif.'
        );
      }
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
