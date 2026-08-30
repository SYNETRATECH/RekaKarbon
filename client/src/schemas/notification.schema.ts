import { z } from 'zod';
import { UuidSchema, DateTimeStringSchema } from './common.schema';

export const NotificationTypeSchema = z.enum([
  'emission_alert',
  'dmrv_flag',
  'multisig_action',
  'kyb_update',
  'tax_notice',
  'trade_filled',
  'cap_breach',
  'dmrv_anomaly',
  'mint_confirmed',
  'info',
]);

export const NotificationPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const SystemNotificationSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1),
  message: z.string().min(1),
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema,
  isRead: z.boolean(),
  actionUrl: z.string().optional(),
  createdAt: DateTimeStringSchema,
});

export const CreateNotificationDtoSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: NotificationTypeSchema,
  priority: NotificationPrioritySchema,
  actionUrl: z.string().optional(),
});

export const WebPushKeysSchema = z.object({
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const SubscribeWebPushParamsSchema = z.object({
  endpoint: z.string().url({ message: 'Push endpoint harus berupa URL valid' }),
  keys: WebPushKeysSchema,
  userAgent: z.string().optional(),
});

export const VapidKeyResponseSchema = z.object({
  publicKey: z.string().min(1),
});

export type NotificationTypeEnum = z.infer<typeof NotificationTypeSchema>;
export type SystemNotificationType = z.infer<typeof SystemNotificationSchema>;
export type CreateNotificationDtoType = z.infer<typeof CreateNotificationDtoSchema>;
export type WebPushKeysType = z.infer<typeof WebPushKeysSchema>;
export type SubscribeWebPushParamsType = z.infer<typeof SubscribeWebPushParamsSchema>;
export type VapidKeyResponseType = z.infer<typeof VapidKeyResponseSchema>;
