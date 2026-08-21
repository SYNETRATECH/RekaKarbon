import { Injectable } from '@nestjs/common';
import type { SystemNotification } from '../types/notification';
import { MOCK_NOTIFICATIONS } from './notifications.mock';
import type { CreateNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly notifications: SystemNotification[] = [
    ...MOCK_NOTIFICATIONS,
  ];

  getNotifications(): Promise<SystemNotification[]> {
    return Promise.resolve(this.notifications);
  }

  markAsRead(id: string): Promise<{ success: boolean; id: string }> {
    const item = this.notifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
    }
    return Promise.resolve({ success: true, id });
  }

  createNotification(dto: CreateNotificationDto): Promise<SystemNotification> {
    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    const notification: SystemNotification = {
      id: `f1a2b3c4-0080-4000-8000-${randomHex}000000`,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      priority: dto.priority,
      isRead: false,
      actionUrl: dto.actionUrl,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notification);
    return Promise.resolve(notification);
  }
}
