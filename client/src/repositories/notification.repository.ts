import { api } from '../lib/api';
import type {
  SystemNotification,
  CreateNotificationDto,
  SubscribeWebPushParams,
  VapidKeyResponse,
} from '../types/notification';
import { SystemNotificationSchema, VapidKeyResponseSchema } from '../schemas';
import { z } from 'zod';

export interface NotificationRepository {
  getNotifications(): Promise<SystemNotification[]>;
  markAsRead(id: string): Promise<{ success: boolean; id: string }>;
  createNotification(data: CreateNotificationDto): Promise<SystemNotification>;
  getVapidPublicKey(): Promise<VapidKeyResponse>;
  subscribeWebPush(data: SubscribeWebPushParams): Promise<{ success: boolean }>;
  unsubscribeWebPush(endpoint: string): Promise<{ success: boolean }>;
}

export class ApiNotificationRepository implements NotificationRepository {
  async getNotifications(): Promise<SystemNotification[]> {
    return api.get<SystemNotification[]>('/notifications', z.array(SystemNotificationSchema));
  }

  async markAsRead(id: string): Promise<{ success: boolean; id: string }> {
    return api.patch<{ success: boolean; id: string }>(
      `/notifications/${id}/read`,
      {},
      z.object({ success: z.boolean(), id: z.string() })
    );
  }

  async createNotification(data: CreateNotificationDto): Promise<SystemNotification> {
    return api.post<SystemNotification>('/notifications', data, SystemNotificationSchema);
  }

  async getVapidPublicKey(): Promise<VapidKeyResponse> {
    return api.get<VapidKeyResponse>(
      '/notifications/webpush/vapid-public-key',
      VapidKeyResponseSchema
    );
  }

  async subscribeWebPush(data: SubscribeWebPushParams): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(
      '/notifications/webpush/subscribe',
      data,
      z.object({ success: z.boolean() })
    );
  }

  async unsubscribeWebPush(endpoint: string): Promise<{ success: boolean }> {
    return api.post<{ success: boolean }>(
      '/notifications/webpush/unsubscribe',
      { endpoint },
      z.object({ success: z.boolean() })
    );
  }
}

import { MockNotificationRepository } from './notification.mock.repository';

export const notificationRepository: NotificationRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockNotificationRepository()
    : new ApiNotificationRepository();
