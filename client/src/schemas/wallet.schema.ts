import { z } from 'zod';
import { IdrAmountSchema, WalletAddressSchema, DateTimeStringSchema } from './common.schema';

export const WalletBalanceResponseSchema = z.object({
  address: WalletAddressSchema,
  balance: IdrAmountSchema,
});

export const WalletTransactionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['DEPOSIT', 'EXPENSE']),
  title: z.string().min(1),
  amount: IdrAmountSchema,
  date: DateTimeStringSchema,
  status: z.enum(['SUCCESS', 'PENDING', 'FAILED']),
});

export const CreateDepositResultSchema = z.object({
  invoiceUrl: z.string().url(),
});

export type WalletBalanceResponseType = z.infer<typeof WalletBalanceResponseSchema>;
export type WalletTransactionType = z.infer<typeof WalletTransactionSchema>;
export type CreateDepositResultType = z.infer<typeof CreateDepositResultSchema>;
