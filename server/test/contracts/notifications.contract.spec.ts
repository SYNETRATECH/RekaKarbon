import { NotificationsController } from '../../src/notifications/notifications.controller';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { WebPushService } from '../../src/notifications/web-push.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  SystemNotificationSchema,
  VapidKeyResponseSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('Notifications API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockNotification = {
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    title: 'Anomali Emisi Terdeteksi',
    message: 'Cerobong STACK-01 melebihi ambang batas SO2 sebesar 420 mg/m3.',
    type: 'cap_breach' as const,
    priority: 'critical' as const,
    isRead: false,
    actionUrl: '/emitter/reports',
    createdAt: '2026-02-14T08:00:00.000Z',
  };

  const mockNotificationsService = {
    getNotifications: jest.fn().mockResolvedValue([mockNotification]),
    markAsRead: jest
      .fn()
      .mockResolvedValue({ ...mockNotification, isRead: true }),
    createNotification: jest.fn().mockResolvedValue(mockNotification),
  };

  const mockWebPushService = {
    getVapidPublicKey: jest.fn().mockReturnValue({
      publicKey:
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
    }),
    subscribe: jest.fn().mockResolvedValue({
      id: 'sub-001',
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: WebPushService,
          useValue: mockWebPushService,
        },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /notifications returns array adhering to SystemNotificationSchema', async () => {
    const res = await harness.http.get('/notifications').expect(200);
    const list = expectContract(res.body, z.array(SystemNotificationSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockNotification.id);
    expect(list[0].type).toBe('cap_breach');
  });

  it('PATCH /notifications/:id/read updates status and returns SystemNotificationSchema', async () => {
    const res = await harness.http
      .patch(`/notifications/${mockNotification.id}/read`)
      .expect(200);
    const item = expectContract(res.body, SystemNotificationSchema);
    expect(item.isRead).toBe(true);
  });

  it('POST /notifications creates a new alert adhering to SystemNotificationSchema', async () => {
    const payload = {
      title: 'Anomali Emisi Terdeteksi',
      message: 'Cerobong STACK-01 melebihi ambang batas SO2 sebesar 420 mg/m3.',
      type: 'cap_breach',
      priority: 'critical',
      actionUrl: '/emitter/reports',
    };
    const res = await harness.http
      .post('/notifications')
      .send(payload)
      .expect(201);
    const item = expectContract(res.body, SystemNotificationSchema);
    expect(item.id).toBe(mockNotification.id);
  });

  it('GET /notifications/webpush/vapid-public-key returns VapidKeyResponseSchema', async () => {
    const res = await harness.http
      .get('/notifications/webpush/vapid-public-key')
      .expect(200);
    const item = expectContract(res.body, VapidKeyResponseSchema);
    expect(item.publicKey).toBeDefined();
    expect(item.publicKey.length).toBeGreaterThan(20);
  });
});
