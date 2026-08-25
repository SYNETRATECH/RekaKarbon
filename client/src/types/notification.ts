export type NotificationType =
  | 'emission_alert'
  | 'dmrv_flag'
  | 'multisig_action'
  | 'kyb_update'
  | 'tax_notice'
  | 'trade_filled'
  | 'cap_breach'
  | 'dmrv_anomaly'
  | 'mint_confirmed'
  | 'info';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: NotificationType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionUrl?: string;
}

export interface WebPushKeys {
  p256dh: string;
  auth: string;
}

export interface SubscribeWebPushParams {
  endpoint: string;
  keys: WebPushKeys;
  userAgent?: string;
}

export interface VapidKeyResponse {
  publicKey: string;
}
