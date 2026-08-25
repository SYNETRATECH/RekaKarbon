import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { SubscribeWebPushDto, UnsubscribeWebPushDto } from './dto';
import {
  WebPushPayload,
  WebPushSubscriptionData,
  VapidKeyResponse,
} from './types';

@Injectable()
export class WebPushService implements OnModuleInit {
  private readonly logger = new Logger(WebPushService.name);
  private vapidPublicKey = '';
  private vapidPrivateKey = '';
  private vapidSubject = '';
  private isConfigured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initVapid();
  }

  /**
   * Initializes VAPID keys from environment variables or auto-generates dev keys.
   */
  public initVapid(): void {
    const envPublic = process.env.VAPID_PUBLIC_KEY;
    const envPrivate = process.env.VAPID_PRIVATE_KEY;
    const envSubject = process.env.VAPID_SUBJECT;

    if (envSubject) {
      this.vapidSubject = envSubject;
    }

    if (envPublic && envPrivate) {
      this.vapidPublicKey = envPublic.trim();
      this.vapidPrivateKey = envPrivate.trim();
      this.isConfigured = true;
    } else {
      // In development or test, generate ephemeral VAPID keys for zero-config startup
      const generated = webpush.generateVAPIDKeys();
      this.vapidPublicKey = generated.publicKey;
      this.vapidPrivateKey = generated.privateKey;
      this.isConfigured = true;
      this.logger.log(
        'VAPID keys not provided in environment; generated ephemeral VAPID keys for session.',
      );
    }

    try {
      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );
      this.logger.log('WebPush VAPID authentication configured successfully.');
    } catch (err) {
      this.logger.error(
        `Failed to set VAPID details: ${(err as Error).message}`,
        (err as Error).stack,
      );
      this.isConfigured = false;
    }
  }

  /**
   * Retrieves the server's VAPID public key for browser PushManager subscription.
   */
  public getVapidPublicKey(): VapidKeyResponse {
    return {
      publicKey: this.vapidPublicKey,
    };
  }

  /**
   * Subscribes a user's browser device endpoint.
   */
  public async subscribe(
    userId: string,
    dto: SubscribeWebPushDto,
  ): Promise<WebPushSubscriptionData> {
    const record = await this.prisma.webPushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
      },
      update: {
        userId,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent,
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `WebPush subscription saved for user: ${userId} (${dto.userAgent || 'unknown device'})`,
    );

    return {
      id: record.id,
      userId: record.userId,
      endpoint: record.endpoint,
      p256dh: record.p256dh,
      auth: record.auth,
      userAgent: record.userAgent || undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Unsubscribes a user's browser device endpoint.
   */
  public async unsubscribe(
    userId: string,
    dto: UnsubscribeWebPushDto,
  ): Promise<{ success: boolean; endpoint: string }> {
    await this.prisma.webPushSubscription.deleteMany({
      where: {
        userId,
        endpoint: dto.endpoint,
      },
    });

    this.logger.log(
      `WebPush subscription removed for user: ${userId} (endpoint: ${dto.endpoint.substring(0, 30)}...)`,
    );

    return {
      success: true,
      endpoint: dto.endpoint,
    };
  }

  /**
   * Dispatches a WebPush notification to all active devices of a target user.
   */
  public async sendNotificationToUser(
    userId: string,
    payload: WebPushPayload,
  ): Promise<{ sent: number; failed: number; pruned: number }> {
    if (!this.isConfigured) {
      this.logger.warn('WebPush is not configured; skipping push dispatch.');
      return { sent: 0, failed: 0, pruned: 0 };
    }

    const subscriptions = await this.prisma.webPushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    let sent = 0;
    let failed = 0;
    let pruned = 0;

    const payloadString = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payloadString);
          sent++;
        } catch (err: unknown) {
          failed++;
          const statusCode = (err as { statusCode?: number }).statusCode;
          // HTTP 410 (Gone) or HTTP 404 (Not Found) indicates expired or revoked push subscription
          if (statusCode === 410 || statusCode === 404) {
            this.logger.warn(
              `Pruning expired WebPush subscription for user ${userId} (HTTP ${statusCode})`,
            );
            await this.prisma.webPushSubscription.deleteMany({
              where: { endpoint: sub.endpoint },
            });
            pruned++;
          } else {
            this.logger.error(
              `Error delivering WebPush to ${sub.endpoint.substring(0, 30)}...: ${(err as Error).message}`,
            );
          }
        }
      }),
    );

    return { sent, failed, pruned };
  }

  /**
   * Broadcasts a WebPush notification across all active subscribers (optionally filtered by Role).
   */
  public async broadcastNotification(
    payload: WebPushPayload,
    role?: Role,
  ): Promise<{ sent: number; failed: number; pruned: number }> {
    if (!this.isConfigured) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    const subscriptions = await this.prisma.webPushSubscription.findMany({
      where: role
        ? {
            user: { role },
          }
        : undefined,
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, pruned: 0 };
    }

    let sent = 0;
    let failed = 0;
    let pruned = 0;
    const payloadString = JSON.stringify(payload);

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payloadString);
          sent++;
        } catch (err: unknown) {
          failed++;
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await this.prisma.webPushSubscription.deleteMany({
              where: { endpoint: sub.endpoint },
            });
            pruned++;
          }
        }
      }),
    );

    return { sent, failed, pruned };
  }

  /**
   * Dispatches a test WebPush notification to the authenticated user.
   */
  public async sendTestNotification(
    userId: string,
    title = 'RekaKarbon Alert Test',
    body = 'WebPush notifications are actively connected and working!',
  ): Promise<{ sent: number; failed: number; pruned: number }> {
    return this.sendNotificationToUser(userId, {
      title,
      body,
      icon: '/logo.png',
      tag: 'rekakarbon-test',
      renotify: true,
      data: {
        timestamp: new Date().toISOString(),
        url: '/notifications',
      },
    });
  }
}
