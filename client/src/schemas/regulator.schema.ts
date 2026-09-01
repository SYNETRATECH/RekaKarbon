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
  FileSizeBytesSchema,
  WalletAddressSchema,
  TxHashSchema,
  DateStringSchema,
  DateTimeStringSchema,
  SpeCertificateIdSchema,
} from './common.schema';

export const NationalForestRegionSchema = z.object({
  id: UuidSchema,
  regionName: z.string().min(1),
  areaHectares: HectaresSchema,
  carbonSequestrationTCO2e: CarbonVolumeSchema,
  fundingDisbursedIDR: IdrAmountSchema,
  forestHealthPercent: PercentageSchema,
});

export const ForestProjectStageSchema = z.object({
  year: z.number().int().positive(),
  title: z.string().min(1),
  milestone: z.string().min(1),
  status: z.enum(['completed', 'ongoing', 'upcoming']),
  canopyDensity: PercentageSchema,
  gsd: z.number().positive(),
  kthName: z.string().min(1),
  farmerIncentiveIDR: IdrAmountSchema,
  incentiveStatus: z.string().min(1),
  speCreditMinted: CarbonVolumeSchema,
  speStatus: z.string().min(1),
  plantedTrees: z.number().int().nonnegative(),
  targetTrees: z.number().int().positive(),
  remainingTrees: z.number().int().nonnegative(),
});

export const ForestProjectTokenBuyerSchema = z.object({
  id: EntityIdSchema,
  companyName: z.string().min(1),
  tCO2e: CarbonVolumeSchema,
  sector: z.string().min(1),
  speCertificateId: SpeCertificateIdSchema,
  txHash: TxHashSchema,
  date: DateStringSchema,
});

export const ForestProjectDisbursementItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().optional(),
  priceIDR: IdrAmountSchema,
  totalIDR: IdrAmountSchema,
});

export const ForestProjectDisbursementSchema = z.object({
  id: EntityIdSchema,
  date: DateStringSchema,
  amountIDR: IdrAmountSchema,
  category: z.string().min(1),
  desc: z.string().min(1),
  txHash: TxHashSchema,
  blockNumber: z.string().min(1),
  vendor: z.string().min(1),
  status: z.string().min(1),
  items: z.array(ForestProjectDisbursementItemSchema),
  proofImages: z.array(z.string()),
});

export const ForestProjectProgressDetailSchema = z.object({
  survivalRatePercent: PercentageSchema,
  canopyHeightMeters: z.number().positive(),
  ndviScore: VegetationIndexSchema,
  disbursedBudgetIDR: IdrAmountSchema,
  stages: z.array(ForestProjectStageSchema),
  tokenBuyers: z.array(ForestProjectTokenBuyerSchema),
  disbursementHistory: z.array(ForestProjectDisbursementSchema),
});

export const ForestProjectCategorySchema = z.enum([
  'mangrove',
  'hutan_hujan',
  'gambut',
  'reforestri',
]);

const ForestProjectApiEcosystemSchema = z.enum([
  'mangrove blue carbon',
  'peatland restoration',
  'agroforestry',
  'tropical rainforest',
]);

const ForestProjectApiStageSchema = z.object({
  year: z.number().int().positive(),
  title: z.string().min(1),
  milestone: z.string(),
  status: z.enum(['completed', 'ongoing', 'upcoming']),
  canopyDensity: PercentageSchema,
  gsd: z.number().positive(),
  kthName: z.string(),
  farmerIncentiveIDR: IdrAmountSchema,
  incentiveStatus: z.string(),
  speCreditMinted: CarbonVolumeSchema,
  speStatus: z.string(),
  plantedTrees: z.number().int().nonnegative(),
  targetTrees: z.number().int().nonnegative(),
  remainingTrees: z.number().int().nonnegative(),
});

const ForestProjectApiTokenBuyerSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  tCO2e: CarbonVolumeSchema,
  sector: z.string().min(1),
  speCertificateId: z.string().min(1),
  txHash: z.string().min(1),
  date: z.string().min(1),
});

const ForestProjectApiDisbursementItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().positive(),
  unit: z.string().optional(),
  priceIDR: IdrAmountSchema,
  totalIDR: IdrAmountSchema,
});

const ForestProjectApiDisbursementSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  amountIDR: IdrAmountSchema,
  category: z.string().min(1),
  desc: z.string().min(1),
  txHash: z.string().min(1),
  blockNumber: z.string().min(1),
  vendor: z.string().min(1),
  status: z.string().min(1),
  items: z.array(ForestProjectApiDisbursementItemSchema),
  proofImages: z.array(z.string()),
});

const ForestProjectApiProgressDetailSchema = z.object({
  survivalRatePercent: PercentageSchema,
  canopyHeightMeters: z.number().positive(),
  bufferAllocatedPercent: PercentageSchema,
  bufferUsedPercent: PercentageSchema,
  reforestationStatusText: z.string().min(1),
  reforestationPartner: z.string().min(1),
  reforestationSite: z.string().min(1),
  targetTrees: z.number().int().nonnegative(),
  plantedTrees: z.number().int().nonnegative(),
  remainingTrees: z.number().int().nonnegative(),
  carbonPricePerTonIDR: IdrAmountSchema,
  totalBudgetIDR: IdrAmountSchema,
  disbursedBudgetIDR: IdrAmountSchema,
  remainingBudgetIDR: IdrAmountSchema,
  currentYear: z.number().int().positive(),
  stages: z.array(ForestProjectApiStageSchema),
  disbursements: z.array(ForestProjectApiDisbursementSchema),
  tokenBuyers: z.array(ForestProjectApiTokenBuyerSchema),
});

export const ForestProjectApiItemSchema = z.object({
  id: UuidSchema,
  projectName: z.string().min(1),
  region: z.string().min(1),
  ecosystemType: ForestProjectApiEcosystemSchema,
  coordinates: z.tuple([LatitudeSchema, LongitudeSchema]),
  areaHectares: HectaresSchema,
  targetSequestrationTCO2e: CarbonVolumeSchema,
  actualSequestrationTCO2e: CarbonVolumeSchema,
  carbonStockTCO2e: CarbonVolumeSchema,
  fundingBudgetIDR: IdrAmountSchema,
  fundingDisbursedIDR: IdrAmountSchema,
  partnerKTH: z.string().min(1),
  kthLeader: z.string().min(1),
  kthMembersCount: z.number().int().nonnegative(),
  auditStatus: z.enum(['verified', 'in_review', 'flagged']),
  droneAuditCount: z.number().int().nonnegative(),
  lastDroneAuditDate: z.string(),
  speCertificateId: z.string().min(1),
  ndviScore: VegetationIndexSchema,
  eviScore: VegetationIndexSchema,
  progressDetail: ForestProjectApiProgressDetailSchema,
});

export const ForestProjectItemSchema = z.object({
  id: UuidSchema,
  projectName: z.string().min(1),
  category: ForestProjectCategorySchema,
  categoryLabel: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.tuple([LatitudeSchema, LongitudeSchema]),
  targetSequestrationTCO2e: CarbonVolumeSchema,
  actualSequestrationTCO2e: CarbonVolumeSchema,
  fundingBudgetIDR: IdrAmountSchema,
  assignedKTH: z.string().min(1),
  dMRVStatus: z.enum(['verified', 'pending_inspection', 'revision']),
  budgetReportFileName: z.string().optional(),
  budgetReportFileSize: FileSizeBytesSchema.optional(),
  polygonCoords: z
    .union([
      z.array(z.object({ lat: LatitudeSchema, lng: LongitudeSchema })),
      z.array(z.tuple([LatitudeSchema, LongitudeSchema])),
    ])
    .optional(),
  progressDetail: ForestProjectProgressDetailSchema.optional(),
});

export const KTHGroupItemSchema = z.object({
  id: UuidSchema,
  groupName: z.string().min(1),
  leaderName: z.string().min(1),
  memberCount: z.number().int().positive(),
  location: z.string().min(1),
  kybStatus: z.enum(['verified', 'pending', 'rejected']),
  registrationNumber: z.string().min(1),
  totalIncentiveReceivedIDR: IdrAmountSchema,
  walletAddress: WalletAddressSchema,
});

export const KTHTransactionItemSchema = z.object({
  id: UuidSchema,
  txHash: TxHashSchema,
  date: DateTimeStringSchema,
  kthName: z.string().min(1),
  projectName: z.string().min(1),
  volumeTCO2e: CarbonVolumeSchema,
  amountIDR: IdrAmountSchema,
  status: z.enum([
    'completed',
    'processing',
    'awaiting_farmer',
    'awaiting_proof',
    'flagged',
    'failed',
  ]),
  issueNote: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        qty: z.number().positive(),
        unit: z.string().optional(),
        price: IdrAmountSchema,
        total: IdrAmountSchema,
      })
    )
    .optional(),
  proofImages: z.array(z.string()).optional(),
});

export const RegulationDocumentUploadItemSchema = z.object({
  id: UuidSchema,
  documentTitle: z.string().min(1),
  category: z.enum(['sk_ptbae', 'spe_grk', 'stp_djp', 'kth_sk']),
  categoryLabel: z.string().min(1),
  agencyIssuer: z.enum(['KLHK', 'DJP', 'KLHK & DJP']),
  fileName: z.string().min(1),
  fileSize: FileSizeBytesSchema,
  uploadDate: DateTimeStringSchema,
  signatoryPerson: z.string().min(1),
  targetEntityName: z.string().min(1),
  status: z.enum(['published', 'verifying', 'archived']),
});

export type NationalForestRegionType = z.infer<typeof NationalForestRegionSchema>;
export type ForestProjectStageType = z.infer<typeof ForestProjectStageSchema>;
export type ForestProjectTokenBuyerType = z.infer<typeof ForestProjectTokenBuyerSchema>;
export type ForestProjectDisbursementItemType = z.infer<typeof ForestProjectDisbursementItemSchema>;
export type ForestProjectDisbursementType = z.infer<typeof ForestProjectDisbursementSchema>;
export type ForestProjectProgressDetailType = z.infer<typeof ForestProjectProgressDetailSchema>;
export type ForestProjectItemType = z.infer<typeof ForestProjectItemSchema>;
export type ForestProjectApiItemType = z.infer<typeof ForestProjectApiItemSchema>;
export type KTHGroupItemType = z.infer<typeof KTHGroupItemSchema>;
export type KTHTransactionItemType = z.infer<typeof KTHTransactionItemSchema>;
export type RegulationDocumentUploadItemType = z.infer<typeof RegulationDocumentUploadItemSchema>;
