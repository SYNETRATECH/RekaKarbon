import { z } from 'zod';
import {
  UuidSchema,
  LatitudeSchema,
  LongitudeSchema,
  PercentageSchema,
  CarbonVolumeSchema,
  IdrAmountSchema,
  DateStringSchema,
  TxHashSchema,
  SpeCertificateIdSchema,
  WalletAddressSchema,
  DateTimeStringSchema,
} from './common.schema';

export const ProjectConditionSchema = z.object({
  canopyDensityPercent: PercentageSchema,
  carbonSequestrationRate: z.number().nonnegative(),
  kthIncentiveDisbursed: IdrAmountSchema,
  droneAuditStatus: z.string().min(1),
  lastSpatialAuditDate: DateStringSchema,
});

export const PurchasedCertificateSchema = z.object({
  id: UuidSchema,
  certificateNumber: SpeCertificateIdSchema,
  projectName: z.string().min(1),
  projectCategory: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.tuple([LatitudeSchema, LongitudeSchema]),
  purchasedVolumeTCO2e: CarbonVolumeSchema,
  pricePerTonIDR: IdrAmountSchema,
  totalPaidIDR: IdrAmountSchema,
  purchaseDate: DateStringSchema,
  registryStandard: z.string().min(1),
  blockchainTxHash: TxHashSchema,
  projectCondition: ProjectConditionSchema,
});

export const RetirementCertificateResultSchema = z.object({
  txHash: TxHashSchema,
  certificateNumber: SpeCertificateIdSchema,
  volumeRetired: CarbonVolumeSchema,
  assetId: z.number().int().nonnegative(),
});

export const RetirementCertificateVerificationSchema = z.object({
  certificateId: z.number().int().positive(),
  certificateNumber: SpeCertificateIdSchema,
  retiree: WalletAddressSchema,
  assetId: z.number().int().nonnegative(),
  amountRetired: CarbonVolumeSchema,
  txHash: TxHashSchema,
  blockNumber: z.number().int().nonnegative(),
  retiredAt: z.union([DateTimeStringSchema, z.null()]),
  chainId: z.number().int().positive(),
  contractAddress: WalletAddressSchema,
});

export const RetirementCertificateHistorySchema = z.array(RetirementCertificateVerificationSchema);

export type ProjectConditionType = z.infer<typeof ProjectConditionSchema>;
export type PurchasedCertificateType = z.infer<typeof PurchasedCertificateSchema>;
export type RetirementCertificateResultType = z.infer<typeof RetirementCertificateResultSchema>;
export type RetirementCertificateVerificationType = z.infer<
  typeof RetirementCertificateVerificationSchema
>;
