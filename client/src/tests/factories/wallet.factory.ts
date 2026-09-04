import { faker } from '@faker-js/faker';
import { fakeDateTimeString } from './domain-generators';
import type { WalletTransactionType } from '../../schemas';

export function createMockWalletTransaction(
  overrides?: Partial<WalletTransactionType>
): WalletTransactionType {
  return {
    id: overrides?.id ?? `tx-${faker.string.numeric(4)}`,
    type: overrides?.type ?? 'DEPOSIT',
    title: overrides?.title ?? 'Top-up Saldo Xendit',
    amount: overrides?.amount ?? faker.number.int({ min: 10000000, max: 100000000 }),
    date: overrides?.date ?? fakeDateTimeString(),
    status: overrides?.status ?? 'SUCCESS',
    ...overrides,
  };
}
