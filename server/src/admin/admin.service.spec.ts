import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role, UserStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminService - Role Management & Protection', () => {
  let service: AdminService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      groupBy: jest.Mock;
    };
    kybProfile: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        groupBy: jest.fn(),
      },
      kybProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new AdminService(prismaMock as unknown as PrismaService);
  });

  describe('getRoleDefinitions', () => {
    it('returns all 7 platform role definitions with rich metadata', () => {
      const roles = service.getRoleDefinitions();
      expect(roles).toHaveLength(7);

      const codes = roles.map((r) => r.code);
      expect(codes).toContain(Role.superadmin);
      expect(codes).toContain(Role.regulator);
      expect(codes).toContain(Role.auditor);
      expect(codes).toContain(Role.ministry);
      expect(codes).toContain(Role.emitter);
      expect(codes).toContain(Role.kth);
      expect(codes).toContain(Role.buyer);

      for (const role of roles) {
        expect(role.label).toBeDefined();
        expect(role.description).toBeDefined();
        expect(role.badgeStyle).toBeDefined();
        expect(role.badgeStyle.bg).toBeDefined();
        expect(role.badgeStyle.text).toBeDefined();
        expect(role.badgeStyle.border).toBeDefined();
        expect(role.isAssignable).toBe(true);
      }
    });
  });

  describe('updateUserRole', () => {
    const adminId = '11111111-1111-4111-8111-111111111111';
    const targetUserId = '22222222-2222-4222-8222-222222222222';

    it('rejects when the administrator attempts to modify their own role (self-demotion)', async () => {
      await expect(
        service.updateUserRole(adminId, Role.emitter, adminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateUserRole(adminId, Role.emitter, adminId),
      ).rejects.toThrow('Administrators cannot modify their own role.');

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when target user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserRole(targetUserId, Role.auditor, adminId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects demoting the sole active superadmin in the system', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: 'other-admin@rekakarbon.id',
        role: Role.superadmin,
        status: UserStatus.ACTIVE,
        kybProfile: null,
        companies: [],
      });
      // Only 1 superadmin exists in system
      prismaMock.user.count.mockResolvedValue(1);

      await expect(
        service.updateUserRole(targetUserId, Role.emitter, adminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateUserRole(targetUserId, Role.emitter, adminId),
      ).rejects.toThrow(
        'Cannot demote the sole active Superadmin. The platform must retain at least one Superadmin.',
      );

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('allows role update for a non-superadmin user', async () => {
      const existingUser = {
        id: targetUserId,
        email: 'user-abc@ptsemen.co.id',
        role: Role.emitter,
        status: UserStatus.ACTIVE,
        kybProfile: { entityName: 'PT Semen Nusantara' },
        companies: [],
      };

      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      prismaMock.user.update.mockResolvedValue({
        ...existingUser,
        role: Role.auditor,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const result = await service.updateUserRole(
        targetUserId,
        Role.auditor,
        adminId,
      );

      expect(result.role).toBe(Role.auditor);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: targetUserId },
        data: { role: Role.auditor },
        include: { kybProfile: true, companies: true },
      });
    });

    it('allows demoting a superadmin if another active superadmin exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: 'second-admin@rekakarbon.id',
        role: Role.superadmin,
        status: UserStatus.ACTIVE,
        kybProfile: null,
        companies: [],
      });
      // 2 superadmins exist
      prismaMock.user.count.mockResolvedValue(2);
      prismaMock.user.update.mockResolvedValue({
        id: targetUserId,
        email: 'second-admin@rekakarbon.id',
        role: Role.regulator,
        status: UserStatus.ACTIVE,
        kybProfile: null,
        companies: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const result = await service.updateUserRole(
        targetUserId,
        Role.regulator,
        adminId,
      );

      expect(result.role).toBe(Role.regulator);
    });
  });

  describe('updateUserStatus', () => {
    const adminId = '11111111-1111-4111-8111-111111111111';
    const targetUserId = '22222222-2222-4222-8222-222222222222';

    it('rejects when the administrator attempts to suspend their own account', async () => {
      await expect(
        service.updateUserStatus(adminId, UserStatus.SUSPENDED, adminId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateUserStatus(adminId, UserStatus.SUSPENDED, adminId),
      ).rejects.toThrow('Administrators cannot suspend their own account.');
    });

    it('allows updating status of another user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: 'other@rekakarbon.id',
        role: Role.emitter,
        status: UserStatus.ACTIVE,
        kybProfile: null,
        companies: [],
      });
      prismaMock.user.update.mockResolvedValue({
        id: targetUserId,
        email: 'other@rekakarbon.id',
        role: Role.emitter,
        status: UserStatus.SUSPENDED,
        kybProfile: null,
        companies: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const result = await service.updateUserStatus(
        targetUserId,
        UserStatus.SUSPENDED,
        adminId,
      );
      expect(result.status).toBe(UserStatus.SUSPENDED);
    });
  });
});
