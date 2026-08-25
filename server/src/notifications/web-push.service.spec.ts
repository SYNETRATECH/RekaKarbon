import { Test, TestingModule } from '@nestjs/testing';
import { WebPushService } from './web-push.service';
import { PrismaService } from '../prisma/prisma.service';
import * as webpush from 'web-push';

jest.mock('web-push', () => {
  const original = jest.requireActual<typeof import('web-push')>('web-push');
  return {
    ...original,
    sendNotification: jest.fn(),
  };
});

describe('WebPushService', () => {
  let service: WebPushService;

  const mockPrismaService = {
    webPushSubscription: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebPushService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebPushService>(WebPushService);
    service.onModuleInit();
  });

  it('should be defined and provide VAPID public key', () => {
    expect(service).toBeDefined();
    const result = service.getVapidPublicKey();
    expect(result.publicKey).toBeDefined();
    expect(typeof result.publicKey).toBe('string');
    expect(result.publicKey.length).toBeGreaterThan(10);
  });

  it('should subscribe a user device and persist to database', async () => {
    const mockRecord = {
      id: 'sub-uuid-1',
      userId: 'user-uuid-1',
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
      p256dh: 'p256dh-key-sample',
      auth: 'auth-secret-sample',
      userAgent: 'Chrome on Windows',
      createdAt: new Date(),
    };

    mockPrismaService.webPushSubscription.upsert.mockResolvedValue(mockRecord);

    const result = await service.subscribe('user-uuid-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
      keys: {
        p256dh: 'p256dh-key-sample',
        auth: 'auth-secret-sample',
      },
      userAgent: 'Chrome on Windows',
    });

    expect(mockPrismaService.webPushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
        },
        create: {
          userId: 'user-uuid-1',
          endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
          p256dh: 'p256dh-key-sample',
          auth: 'auth-secret-sample',
          userAgent: 'Chrome on Windows',
        },
      }),
    );

    expect(result.id).toBe('sub-uuid-1');
    expect(result.userId).toBe('user-uuid-1');
    expect(result.endpoint).toBe(
      'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
    );
  });

  it('should unsubscribe a user device', async () => {
    mockPrismaService.webPushSubscription.deleteMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.unsubscribe('user-uuid-1', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
    });

    expect(
      mockPrismaService.webPushSubscription.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        userId: 'user-uuid-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-1',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should send notification to active user subscriptions and prune 410 Gone endpoints', async () => {
    mockPrismaService.webPushSubscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-uuid-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/active-device',
        p256dh: 'key-1',
        auth: 'auth-1',
      },
      {
        id: 'sub-2',
        userId: 'user-uuid-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/expired-device',
        p256dh: 'key-2',
        auth: 'auth-2',
      },
    ]);

    const sendNotifMock = webpush.sendNotification as jest.MockedFunction<
      typeof webpush.sendNotification
    >;

    sendNotifMock.mockImplementation((sub: webpush.PushSubscription) => {
      if (sub.endpoint.includes('active-device')) {
        return Promise.resolve({
          statusCode: 201,
          body: '',
          headers: {},
        });
      }
      const err = Object.assign(new Error('Subscription expired'), {
        statusCode: 410,
      });
      return Promise.reject(err);
    });

    const result = await service.sendNotificationToUser('user-uuid-1', {
      title: 'Test Anomaly Detected',
      body: 'PT Semen Nusantara emission exceeded cap',
    });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.pruned).toBe(1);

    expect(
      mockPrismaService.webPushSubscription.deleteMany,
    ).toHaveBeenCalledWith({
      where: { endpoint: 'https://fcm.googleapis.com/fcm/send/expired-device' },
    });
  });

  it('should broadcast notification across multiple user devices', async () => {
    mockPrismaService.webPushSubscription.findMany.mockResolvedValue([
      {
        id: 'sub-1',
        userId: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/device-1',
        p256dh: 'key-1',
        auth: 'auth-1',
      },
      {
        id: 'sub-2',
        userId: 'user-2',
        endpoint: 'https://fcm.googleapis.com/fcm/send/device-2',
        p256dh: 'key-2',
        auth: 'auth-2',
      },
    ]);

    const sendNotifMock = webpush.sendNotification as jest.MockedFunction<
      typeof webpush.sendNotification
    >;

    sendNotifMock.mockResolvedValue({
      statusCode: 201,
      body: '',
      headers: {},
    });

    const result = await service.broadcastNotification({
      title: 'Global Compliance Alert',
      body: 'Quarterly emission audit window is open',
    });

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });
});
