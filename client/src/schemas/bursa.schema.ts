import { z } from 'zod';
import { UuidSchema, IdrAmountSchema, CarbonVolumeSchema, PercentageSchema } from './common.schema';

export const BursaCategorySchema = z.enum(['mangrove', 'hutan', 'gambut']);

export const BursaItemSchema = z.object({
  id: UuidSchema,
  blockchainListingId: z.string().nullable(),
  projectId: UuidSchema.nullable(),
  kthGroupId: UuidSchema.nullable(),
  name: z.string().min(1),
  verified: z.boolean(),
  category: BursaCategorySchema,
  categoryLabel: z.string().min(1),
  location: z.string().min(1),
  pricePerTonIDR: IdrAmountSchema,
  floorPricePerTonIDR: IdrAmountSchema,
  change24h: z.number(),
  volumeAvailableTCO2e: CarbonVolumeSchema,
  volumeSoldTCO2e: CarbonVolumeSchema,
  supplyPercent: PercentageSchema,
  vintageYear: z.number().int().nullable(),
  speCertificateNumber: z.string().min(1),
  projectSnapshotMerkleRoot: z.string().nullable(),
  priceUpdatedAt: z.string().datetime().nullable(),
});

export const BursaWorkflowStatusSchema = z.enum([
  'DRAFT',
  'AWAITING_KTH_CONFIRMATION',
  'ACTIVATING',
  'ACTIVE',
  'PARTIALLY_FILLED',
  'FILLED',
  'FROZEN',
  'CANCELLED',
  'BLOCKCHAIN_FAILED',
]);

export const BursaWorkflowListingSchema = z.object({
  id: UuidSchema,
  blockchainListingId: z.string().nullable(),
  projectId: UuidSchema.nullable(),
  kthGroupId: UuidSchema.nullable(),
  projectName: z.string().min(1),
  province: z.string().min(1),
  ecosystemType: z.string().min(1),
  kthGroupName: z.string().nullable(),
  speCertificateNumber: z.string().min(1),
  vintageYear: z.number().int(),
  initialVolumeTco2e: CarbonVolumeSchema,
  verifiedSaleableVolumeTco2e: CarbonVolumeSchema,
  volumeLockedTco2e: CarbonVolumeSchema,
  volumeAvailableTco2e: CarbonVolumeSchema,
  volumeSoldTco2e: CarbonVolumeSchema,
  eligibleProjectCostIdr: IdrAmountSchema,
  floorPricePerTonIdr: IdrAmountSchema,
  currentPricePerTonIdr: IdrAmountSchema,
  projectSnapshotMerkleRoot: z.string().nullable(),
  kthConfirmationStatus: z.enum(['PENDING', 'CONFIRMED', 'REVISION_REQUIRED']),
  status: BursaWorkflowStatusSchema,
  draftTxHash: z.string().nullable(),
  kthRecipientTxHash: z.string().nullable(),
  kthConfirmationTxHash: z.string().nullable(),
  activationTxHash: z.string().nullable(),
  cancellationTxHash: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const BursaListingCandidateSchema = z.object({
  carbonTokenId: UuidSchema,
  speCertificateNumber: z.string().min(1),
  projectId: UuidSchema,
  projectName: z.string().min(1),
  province: z.string().min(1),
  kthGroupId: UuidSchema,
  kthGroupName: z.string().min(1),
  vintageYear: z.number().int(),
  availableVolumeTco2e: CarbonVolumeSchema,
  eligibleProjectCostIdr: IdrAmountSchema,
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
export type BursaWorkflowListingType = z.infer<typeof BursaWorkflowListingSchema>;
export type BursaListingCandidateType = z.infer<typeof BursaListingCandidateSchema>;
export type BursaPurchaseEligibilityType = z.infer<typeof BursaPurchaseEligibilitySchema>;
