import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, UserStatus, KybStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { QueryUsersDto, CreateUserDto, ReviewKybDto } from './dto';
import type {
  AdminUserItem,
  AdminStats,
  AdminKybItem,
  RoleDefinition,
} from './types/admin.types';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  getRoleDefinitions(): RoleDefinition[] {
    return [
      {
        code: Role.emitter,
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
        code: Role.kth,
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
        code: Role.auditor,
        label: 'Auditor Independen (Verifier)',
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
        code: Role.regulator,
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
        code: Role.ministry,
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
        code: Role.buyer,
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
        code: Role.superadmin,
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
  }

  async getStats(): Promise<AdminStats> {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingVerificationUsers,
      roleGroupings,
      pendingKybCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
      this.prisma.user.count({
        where: { status: UserStatus.PENDING_VERIFICATION },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.kybProfile.count({
        where: { verificationStatus: KybStatus.PENDING },
      }),
    ]);

    const roleCounts: Record<Role, number> = {
      [Role.superadmin]: 0,
      [Role.regulator]: 0,
      [Role.auditor]: 0,
      [Role.ministry]: 0,
      [Role.emitter]: 0,
      [Role.kth]: 0,
      [Role.buyer]: 0,
    };

    for (const group of roleGroupings) {
      roleCounts[group.role] = group._count.role;
    }

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      pendingVerificationUsers,
      roleCounts,
      pendingKybCount,
    };
  }

  async getUsers(query: QueryUsersDto): Promise<{
    data: AdminUserItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search && query.search.trim() !== '') {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          kybProfile: true,
          companies: true,
        },
      }),
    ]);

    const data: AdminUserItem[] = users.map((u) => {
      const agency =
        u.kybProfile?.entityName ||
        (u.companies.length > 0 ? u.companies[0].name : undefined);

      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName || undefined,
        role: u.role,
        status: u.status,
        agency,
        walletAddress: u.walletAddress || undefined,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createUser(dto: CreateUserDto): Promise<AdminUserItem> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new BadRequestException('Email sudah terdaftar dalam sistem.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const userId = randomUUID();

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        walletAddress: dto.walletAddress,
        status: UserStatus.ACTIVE,
      },
    });

    if (dto.agency) {
      await this.prisma.kybProfile.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          entityName: dto.agency,
          verificationStatus: KybStatus.VERIFIED,
          verifiedAt: new Date(),
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || undefined,
      role: user.role,
      status: user.status,
      agency: dto.agency,
      walletAddress: user.walletAddress || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateUserRole(
    userId: string,
    role: Role,
    callerId?: string,
  ): Promise<AdminUserItem> {
    if (callerId && callerId === userId) {
      throw new BadRequestException(
        'Administrators cannot modify their own role.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { kybProfile: true, companies: true },
    });

    if (!existing) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (existing.role === Role.superadmin && role !== Role.superadmin) {
      const superadminCount = await this.prisma.user.count({
        where: { role: Role.superadmin, status: UserStatus.ACTIVE },
      });
      if (superadminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the sole active Superadmin. The platform must retain at least one Superadmin.',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { kybProfile: true, companies: true },
    });

    const agency =
      updated.kybProfile?.entityName ||
      (updated.companies.length > 0 ? updated.companies[0].name : undefined);

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName || undefined,
      role: updated.role,
      status: updated.status,
      agency,
      walletAddress: updated.walletAddress || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
    callerId?: string,
  ): Promise<AdminUserItem> {
    if (callerId && callerId === userId && status === UserStatus.SUSPENDED) {
      throw new BadRequestException(
        'Administrators cannot suspend their own account.',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { kybProfile: true, companies: true },
    });

    if (!existing) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      include: { kybProfile: true, companies: true },
    });

    const agency =
      updated.kybProfile?.entityName ||
      (updated.companies.length > 0 ? updated.companies[0].name : undefined);

    return {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName || undefined,
      role: updated.role,
      status: updated.status,
      agency,
      walletAddress: updated.walletAddress || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async resetPassword(
    userId: string,
  ): Promise<{ temporaryPassword: string; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const temporaryPassword = `RekaKarbon#${Math.floor(100000 + Math.random() * 900000)}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Password reset for user ${existing.email} by Admin.`);

    return {
      temporaryPassword,
      message: 'Kata sandi sementara berhasil dibuat.',
    };
  }

  async getKybSubmissions(): Promise<AdminKybItem[]> {
    const submissions = await this.prisma.kybProfile.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    return submissions.map((k) => ({
      id: k.id,
      userId: k.userId,
      entityName: k.entityName,
      category: k.category,
      npwp: k.npwp,
      registrationNumber: k.registrationNumber,
      signatoryName: k.signatoryName,
      verificationStatus: k.verificationStatus,
      verifiedAt: k.verifiedAt ? k.verifiedAt.toISOString() : null,
      createdAt: k.createdAt.toISOString(),
      userEmail: k.user.email,
      userFullName: k.user.fullName,
    }));
  }

  async reviewKyb(
    kybId: string,
    dto: ReviewKybDto,
    reviewerId?: string,
  ): Promise<AdminKybItem> {
    const existing = await this.prisma.kybProfile.findUnique({
      where: { id: kybId },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException('Profil KYB tidak ditemukan.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const reviewed = await tx.kybProfile.update({
        where: { id: kybId },
        data: {
          verificationStatus: dto.status,
          verifiedAt: new Date(),
          verifiedByUserId: reviewerId || null,
        },
        include: { user: true },
      });

      // If approved, automatically activate the user account
      if (dto.status === KybStatus.VERIFIED) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { status: UserStatus.ACTIVE },
        });
      }

      return reviewed;
    });

    return {
      id: updated.id,
      userId: updated.userId,
      entityName: updated.entityName,
      category: updated.category,
      npwp: updated.npwp,
      registrationNumber: updated.registrationNumber,
      signatoryName: updated.signatoryName,
      verificationStatus: updated.verificationStatus,
      verifiedAt: updated.verifiedAt ? updated.verifiedAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
      userEmail: updated.user.email,
      userFullName: updated.user.fullName,
    };
  }
}
