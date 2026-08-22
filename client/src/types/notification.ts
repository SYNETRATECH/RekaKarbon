export type NotificationType =
  'emission_alert' | 'dmrv_flag' | 'multisig_action' | 'kyb_update' | 'tax_notice' | 'trade_filled';

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
