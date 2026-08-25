import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../auth/types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          kybProfile: true,
          companies: true,
        },
      });

      if (!user) return undefined;

      const agency =
        user.kybProfile?.entityName ||
        (user.companies.length > 0 ? user.companies[0].name : undefined);

      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        fullName: user.fullName || undefined,
        role: user.role,
        agency,
        walletAddress: user.walletAddress || undefined,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error querying user by email (${normalizedEmail}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      return undefined;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    if (!id) return undefined;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          kybProfile: true,
          companies: true,
        },
      });

      if (!user) return undefined;

      const agency =
        user.kybProfile?.entityName ||
        (user.companies.length > 0 ? user.companies[0].name : undefined);

      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        fullName: user.fullName || undefined,
        role: user.role,
        agency,
        walletAddress: user.walletAddress || undefined,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error querying user by ID (${id}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      return undefined;
    }
  }

  async create(user: User): Promise<User> {
    const normalizedEmail = user.email.trim().toLowerCase();
    try {
      const created = await this.prisma.user.create({
        data: {
          id: user.id,
          email: normalizedEmail,
          passwordHash: user.passwordHash,
          fullName: user.fullName,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        include: {
          kybProfile: true,
          companies: true,
        },
      });

      const agency =
        created.kybProfile?.entityName ||
        (created.companies.length > 0 ? created.companies[0].name : undefined);

      return {
        id: created.id,
        email: created.email,
        passwordHash: created.passwordHash,
        fullName: created.fullName || undefined,
        role: created.role,
        agency,
        walletAddress: created.walletAddress || undefined,
        createdAt: created.createdAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error creating user (${normalizedEmail}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      return user;
    }
  }
}
