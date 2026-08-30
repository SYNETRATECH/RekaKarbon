import { z } from 'zod';
import {
  UuidSchema,
  DateStringSchema,
  DateTimeStringSchema,
  NpwpSchema,
  IdrAmountSchema,
  CarbonVolumeSchema,
} from './common.schema';

export const MultiSigRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const MultiSigRequestSchema = z.object({
  id: UuidSchema,
  txType: z.string().min(1),
  applicant: z.string().min(1),
  amountIDR: IdrAmountSchema.optional(),
  volumeTCO2e: CarbonVolumeSchema.optional(),
  signersCount: z.number().int().nonnegative(),
  requiredSigners: z.number().int().positive(),
  status: MultiSigRequestStatusSchema,
  date: DateStringSchema,
});

export const KybCategorySchema = z.enum(['kth', 'corporate']);

export const KybVerificationStatusSchema = z.enum(['verified', 'pending', 'rejected']);

export const KybQueueItemSchema = z.object({
  id: UuidSchema,
  entityName: z.string().min(1),
  category: KybCategorySchema,
  submissionDate: DateStringSchema,
  documentsCount: z.number().int().nonnegative(),
  verificationStatus: KybVerificationStatusSchema,
  assignedVerifier: z.string().min(1),
});

export const DjpLogStatusSchema = z.enum(['synced', 'pending', 'failed']);

export const DjpLogItemSchema = z.object({
  id: UuidSchema,
  timestamp: DateTimeStringSchema,
  taxPayerName: z.string().min(1),
  npwp: NpwpSchema,
  stpDocId: z.string().min(1),
  carbonTaxCalculatedIDR: IdrAmountSchema,
  status: DjpLogStatusSchema,
});

export type MultiSigRequestType = z.infer<typeof MultiSigRequestSchema>;
export type KybQueueItemType = z.infer<typeof KybQueueItemSchema>;
export type DjpLogItemType = z.infer<typeof DjpLogItemSchema>;
