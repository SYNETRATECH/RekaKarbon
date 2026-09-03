import { z } from 'zod';
import { UuidSchema, IdrAmountSchema, CarbonVolumeSchema, PercentageSchema } from './common.schema';

export const BursaCategorySchema = z.enum(['mangrove', 'hutan', 'gambut']);

export const BursaItemSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  verified: z.boolean(),
  category: BursaCategorySchema,
  categoryLabel: z.string().min(1),
  location: z.string().min(1),
  pricePerTonIDR: IdrAmountSchema,
  change24h: z.number(),
  volumeAvailableTCO2e: CarbonVolumeSchema,
  supplyPercent: PercentageSchema,
});

export const BursaEligibilityReasonSchema = z.enum([
  'eligible',
  'company_unavailable',
  'wallet_unavailable',
  'report_not_submitted',
  'report_pending_audit',
  'report_revision_required',
  'ptbae_unavailable',
  'no_deficit',
  'offset_tokens_available',
]);

export const BursaPurchaseEligibilitySchema = z.object({
  canPurchase: z.boolean(),
  reason: BursaEligibilityReasonSchema,
  message: z.string().min(1),
  complianceYear: z.number().int().nullable(),
  reportId: UuidSchema.nullable(),
  reportStatus: z.string().nullable(),
  approvedEmissionsTCO2e: CarbonVolumeSchema.nullable(),
  ptbaeQuotaTCO2e: CarbonVolumeSchema.nullable(),
  retiredTCO2e: CarbonVolumeSchema,
  availableTokenBalanceTCO2e: CarbonVolumeSchema,
  complianceDeficitTCO2e: CarbonVolumeSchema.nullable(),
  purchaseRequirementTCO2e: CarbonVolumeSchema,
});

export type BursaCategoryType = z.infer<typeof BursaCategorySchema>;
export type BursaItemType = z.infer<typeof BursaItemSchema>;
export type BursaPurchaseEligibilityType = z.infer<typeof BursaPurchaseEligibilitySchema>;
