import { api } from '../lib/api';
import type { SystemNotification, CreateNotificationDto } from '../types/notification';

export interface NotificationRepository {
  getNotifications(): Promise<SystemNotification[]>;
  markAsRead(id: string): Promise<{ success: boolean; id: string }>;
  createNotification(data: CreateNotificationDto): Promise<SystemNotification>;
}

export class ApiNotificationRepository implements NotificationRepository {
  async getNotifications(): Promise<SystemNotification[]> {
    return api.get<SystemNotification[]>('/notifications');
  }

  async markAsRead(id: string): Promise<{ success: boolean; id: string }> {
    return api.patch<{ success: boolean; id: string }>(`/notifications/${id}/read`, {});
  }

  async createNotification(data: CreateNotificationDto): Promise<SystemNotification> {
    return api.post<SystemNotification>('/notifications', data);
  }
}

export const notificationRepository: NotificationRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./notification.mock.repository')).MockNotificationRepository()
    : new ApiNotificationRepository();
