export interface WebPushKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushSubscriptionData {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: string;
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  renotify?: boolean;
  data?: {
    url?: string;
    notificationId?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface VapidKeyResponse {
  publicKey: string;
}
