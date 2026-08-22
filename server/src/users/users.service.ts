import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../types/auth';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) return undefined;
      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt.toISOString(),
      };
    } catch {
      return undefined;
    }
  }

  async findById(id: string): Promise<User | undefined> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) return undefined;
      return {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        createdAt: user.createdAt.toISOString(),
      };
    } catch {
      return undefined;
    }
  }

  async create(user: User): Promise<User> {
    try {
      const created = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          passwordHash: user.passwordHash,
        },
      });
      return {
        id: created.id,
        email: created.email,
        passwordHash: created.passwordHash,
        createdAt: created.createdAt.toISOString(),
      };
    } catch {
      return user;
    }
  }
}
