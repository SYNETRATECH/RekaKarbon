import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationType as PrismaNotificationType,
  PriorityLevel as PrismaPriorityLevel,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  SystemNotification,
  NotificationType,
} from '../types/notification';
import type { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(): Promise<SystemNotification[]> {
    const records = await this.prisma.systemNotification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type.toLowerCase() as NotificationType,
      priority: n.priority.toLowerCase() as
        'critical' | 'high' | 'medium' | 'low',
      isRead: n.isRead,
      actionUrl: n.actionUrl || undefined,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markAsRead(id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.systemNotification.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `System notification with ID '${id}' was not found`,
      );
    }

    await this.prisma.systemNotification.update({
      where: { id },
      data: { isRead: true },
    });
    return { success: true, id };
  }

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<SystemNotification> {
    const prismaType = dto.type.toUpperCase() as PrismaNotificationType;
    const prismaPriority = dto.priority.toUpperCase() as PrismaPriorityLevel;

    const created = await this.prisma.systemNotification.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: prismaType,
        priority: prismaPriority,
        actionUrl: dto.actionUrl,
      },
    });
    return {
      id: created.id,
      title: created.title,
      message: created.message,
      type: dto.type,
      priority: dto.priority,
      isRead: created.isRead,
      actionUrl: created.actionUrl || undefined,
      createdAt: created.createdAt.toISOString(),
    };
  }
}
