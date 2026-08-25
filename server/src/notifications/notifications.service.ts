import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationType as PrismaNotificationType,
  PriorityLevel as PrismaPriorityLevel,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebPushService } from './web-push.service';
import type { SystemNotification, NotificationType } from './types';
import type { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webPushService: WebPushService,
  ) {}

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

    // Automatically trigger WebPush delivery asynchronously
    this.webPushService
      .broadcastNotification({
        title: dto.title,
        body: dto.message,
        icon: '/logo.png',
        tag: `notif-${created.id}`,
        renotify: dto.priority === 'critical' || dto.priority === 'high',
        data: {
          url: dto.actionUrl || '/notifications',
          notificationId: created.id,
          priority: dto.priority,
          timestamp: created.createdAt.toISOString(),
        },
      })
      .catch((err) => {
        // Log error without blocking notification creation response
        console.error('Failed to broadcast WebPush notification:', err);
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
