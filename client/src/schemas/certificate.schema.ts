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

export type ProjectConditionType = z.infer<typeof ProjectConditionSchema>;
export type PurchasedCertificateType = z.infer<typeof PurchasedCertificateSchema>;
