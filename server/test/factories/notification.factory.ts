import { fakeUuid, fakeDateTimeString } from './domain-generators';
import type { SystemNotification } from '../../../client/src/schemas';

export function createMockNotification(
  overrides?: Partial<SystemNotification>,
): SystemNotification {
  return {
    id: overrides?.id ?? fakeUuid(),
    title: overrides?.title ?? 'Anomali Emisi Terdeteksi',
    message:
      overrides?.message ??
      'Cerobong STACK-01 melebihi ambang batas SO2 sebesar 420 mg/m3.',
    type: overrides?.type ?? 'cap_breach',
    priority: overrides?.priority ?? 'critical',
    isRead: overrides?.isRead ?? false,
    actionUrl: overrides?.actionUrl ?? '/emitter/reports',
    createdAt: overrides?.createdAt ?? fakeDateTimeString(),
    ...overrides,
  };
}
