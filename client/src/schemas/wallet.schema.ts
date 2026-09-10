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

export const WalletLinkChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  nonce: z.string().min(1),
  message: z.string().min(1),
  expiresAt: DateTimeStringSchema,
});

export const WalletLinkResultSchema = z.object({
  address: WalletAddressSchema,
  linkedAt: DateTimeStringSchema,
});

export type WalletBalanceResponseType = z.infer<typeof WalletBalanceResponseSchema>;
export type WalletTransactionType = z.infer<typeof WalletTransactionSchema>;
export type CreateDepositResultType = z.infer<typeof CreateDepositResultSchema>;
export type WalletLinkChallengeType = z.infer<typeof WalletLinkChallengeSchema>;
export type WalletLinkResultType = z.infer<typeof WalletLinkResultSchema>;
