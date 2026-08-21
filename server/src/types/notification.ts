export type NotificationType =
  'cap_breach' | 'dmrv_anomaly' | 'multisig_action' | 'mint_confirmed' | 'info';

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
