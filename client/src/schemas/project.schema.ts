import { z } from 'zod';
import {
  UuidSchema,
  EntityIdSchema,
  LatitudeSchema,
  LongitudeSchema,
  HectaresSchema,
  CarbonVolumeSchema,
  IdrAmountSchema,
  PercentageSchema,
  VegetationIndexSchema,
  TxHashSchema,
  DateStringSchema,
  SpeCertificateIdSchema,
} from './common.schema';

export const ProjectCoordinateSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
});

export const ReforestationStageSchema = z.object({
  year: z.number().int().positive(),
  title: z.string().min(1),
  milestone: z.string().min(1),
  status: z.enum(['completed', 'ongoing', 'upcoming']),
  canopyDensity: PercentageSchema,
  gsd: z.number().positive(),
  kthName: z.string(),
  farmerIncentive: IdrAmountSchema,
  incentiveStatus: z.string(),
  speCreditMinted: CarbonVolumeSchema,
  speStatus: z.string().min(1),
  targetTrees: z.number().int().positive().optional(),
  plantedTrees: z.number().int().nonnegative().optional(),
  remainingTrees: z.number().int().nonnegative().optional(),
});

export const DisbursementItemDetailSchema = z.object({
  name: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().optional(),
  price: IdrAmountSchema,
  total: IdrAmountSchema,
});

export const DisbursementItemSchema = z.object({
  id: EntityIdSchema,
  date: DateStringSchema,
  amount: IdrAmountSchema,
  category: z.string().min(1),
  desc: z.string().min(1),
  txHash: TxHashSchema,
  blockNumber: z.string().min(1),
  vendor: z.string().min(1),
  items: z.array(DisbursementItemDetailSchema).optional(),
  proofImages: z.array(z.string()).optional(),
});

export const TokenBuyerSchema = z.object({
  id: EntityIdSchema,
  companyId: z.string().optional(),
  companyName: z.string().min(1),
  sector: z.string().min(1),
  tCO2e: CarbonVolumeSchema,
  amountIDR: IdrAmountSchema,
  pricePerTon: IdrAmountSchema.optional(),
  purchaseDate: DateStringSchema,
  speCertificateId: SpeCertificateIdSchema,
  txHash: TxHashSchema,
  blockNumber: z.string().min(1),
  verificationStatus: z.string().min(1),
  auditor: z.string().min(1),
  desc: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  region: z.string().min(1),
  center: z.tuple([LatitudeSchema, LongitudeSchema]),
  zoom: z.number().int().min(1).max(22),
  area: HectaresSchema,
  rawAreaVal: HectaresSchema,
  carbon: CarbonVolumeSchema,
  rawCarbonVal: CarbonVolumeSchema,
  ndvi: VegetationIndexSchema,
  evi: VegetationIndexSchema,
  coordinates: z.array(ProjectCoordinateSchema),
  trendLabels: z.array(z.string()),
  trendData: z.array(z.number()),
  survivalRate: PercentageSchema,
  canopyHeight: z.number().positive(),
  bufferAllocated: CarbonVolumeSchema,
  bufferUsed: CarbonVolumeSchema,
  reforestationStatus: z.string().min(1),
  reforestationPartner: z.string(),
  reforestationSite: z.string().min(1),
  targetTrees: z.number().int().positive().optional(),
  plantedTrees: z.number().int().nonnegative().optional(),
  remainingTrees: z.number().int().nonnegative().optional(),
  carbonPricePerTon: IdrAmountSchema.optional(),
  totalBudget: IdrAmountSchema,
  disbursedBudget: IdrAmountSchema,
  remainingBudget: IdrAmountSchema,
  currentYear: z.number().int().positive(),
  stages: z.array(ReforestationStageSchema),
  disbursementHistory: z.array(DisbursementItemSchema),
  tokenBuyers: z.array(TokenBuyerSchema),
  budgetReportFileName: z.string().optional(),
  budgetReportFileSize: z.number().optional(),
});

export type ProjectCoordinateType = z.infer<typeof ProjectCoordinateSchema>;
export type ReforestationStageType = z.infer<typeof ReforestationStageSchema>;
export type DisbursementItemDetailType = z.infer<typeof DisbursementItemDetailSchema>;
export type DisbursementItemType = z.infer<typeof DisbursementItemSchema>;
export type TokenBuyerType = z.infer<typeof TokenBuyerSchema>;
export type ProjectType = z.infer<typeof ProjectSchema>;
