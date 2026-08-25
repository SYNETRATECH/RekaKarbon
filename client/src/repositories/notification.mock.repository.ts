import type {
  SystemNotification,
  CreateNotificationDto,
  SubscribeWebPushParams,
  VapidKeyResponse,
} from '../types/notification';
import type { NotificationRepository } from './notification.repository';

export class MockNotificationRepository implements NotificationRepository {
  private notifications: SystemNotification[] = [
    {
      id: 'f1a2b3c4-0080-4000-8000-111111111111',
      title: 'Peringatan Defisit Emisi PT Semen Nusantara Tuban',
      message:
        'Emisi melebihi kuota sebesar 680 tCO2e. Surat Tagihan Pajak (STP) telah diterbitkan.',
      type: 'emission_alert',
      priority: 'critical',
      isRead: false,
      actionUrl: '/dashboard',
      createdAt: new Date().toISOString(),
    },
  ];

  async getNotifications(): Promise<SystemNotification[]> {
    return Promise.resolve([...this.notifications]);
  }

  async markAsRead(id: string): Promise<{ success: boolean; id: string }> {
    const item = this.notifications.find((n) => n.id === id);
    if (item) item.isRead = true;
    return Promise.resolve({ success: true, id });
  }

  async createNotification(data: CreateNotificationDto): Promise<SystemNotification> {
    const notif: SystemNotification = {
      id: `mock-notif-${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      isRead: false,
      actionUrl: data.actionUrl,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return Promise.resolve(notif);
  }

  async getVapidPublicKey(): Promise<VapidKeyResponse> {
    return Promise.resolve({
      publicKey: 'BCsE6L7_mock_vapid_public_key_for_client_development_and_testing_purposes',
    });
  }

  async subscribeWebPush(_data: SubscribeWebPushParams): Promise<{ success: boolean }> {
    return Promise.resolve({ success: true });
  }

  async unsubscribeWebPush(_endpoint: string): Promise<{ success: boolean }> {
    return Promise.resolve({ success: true });
  }
}
