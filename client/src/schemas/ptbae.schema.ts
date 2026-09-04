import { z } from 'zod';
import {
  UuidSchema,
  CarbonVolumeSchema,
  YearSchema,
  DateTimeStringSchema,
  PercentageSchema,
} from './common.schema';

export const PtbaeApplicationStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_audit',
  'revision_required',
  'ministry_review',
  'approval_processing',
  'approved',
  'rejected',
  'expired',
]);

export const PtbaeDocumentTypeSchema = z.enum([
  'technical_data',
  'production_plan',
  'baseline_emission',
  'mitigation_plan',
  'supporting_document',
]);

export const PtbaeAnchorStatusSchema = z.enum(['pending', 'processing', 'confirmed', 'failed']);

export const PtbaeTechnicalDataSchema = z.object({
  machineryDescription: z.string().min(1),
  fuelTypes: z.array(z.string()),
  installedCapacityMW: z.number().nonnegative(),
  energyEfficiencyPercent: PercentageSchema,
  mitigationTechnology: z.string().min(1),
});

export const PtbaeProductionDataSchema = z.object({
  plannedVolumeTons: z.number().nonnegative(),
  actualVolumeTons: z.number().nonnegative().optional(),
  productUnit: z.string().min(1),
});

export const PtbaeApplicationDocumentSchema = z.object({
  id: z.string().min(1),
  documentType: PtbaeDocumentTypeSchema,
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().nonnegative(),
  fileHash: z.string().nullable(),
  accessUrl: z.string().min(1),
  createdAt: DateTimeStringSchema,
});

export const PtbaeApplicationAllocationSchema = z.object({
  id: z.string().min(1),
  quotaTCO2e: CarbonVolumeSchema,
  status: z.enum(['LEGACY', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']),
  sourceDocument: z.string().nullable(),
  documentNumber: z.string().nullable(),
  blockchainTxHash: z.string().nullable(),
  issuanceTxHash: z.string().nullable(),
  decisionMerkleRoot: z.string().nullable(),
  applicationVersionId: z.string().nullable(),
  effectiveFrom: z.string().nullable(),
  effectiveUntil: z.string().nullable(),
});

export const PtbaeApplicationIntegritySchema = z.object({
  version: z.number().int().positive(),
  snapshotHash: z.string().min(1),
  merkleRoot: z.string().min(1),
  anchorStatus: PtbaeAnchorStatusSchema.nullable(),
  transactionHash: z.string().nullable(),
  confirmedAt: DateTimeStringSchema.nullable(),
});

export const PtbaeApplicationSchema = z.object({
  id: UuidSchema,
  companyId: UuidSchema,
  companyName: z.string().min(1),
  emissionReportId: z.string().nullable(),
  complianceYear: YearSchema,
  status: PtbaeApplicationStatusSchema,
  facilityName: z.string().min(1),
  technicalData: PtbaeTechnicalDataSchema,
  productionData: PtbaeProductionDataSchema,
  baselineEmissionTCO2e: CarbonVolumeSchema,
  mitigationPlan: z.string().min(1),
  emitterNotes: z.string().nullable(),
  submittedAt: DateTimeStringSchema.nullable(),
  auditedAt: DateTimeStringSchema.nullable(),
  auditorNotes: z.string().nullable(),
  ministryDecidedAt: DateTimeStringSchema.nullable(),
  ministryNotes: z.string().nullable(),
  currentVersion: z.number().int().positive(),
  latestMerkleRoot: z.string().nullable(),
  latestAnchorStatus: PtbaeAnchorStatusSchema.nullable(),
  latestAnchoredAt: DateTimeStringSchema.nullable(),
  integrity: PtbaeApplicationIntegritySchema.nullable(),
  allocation: PtbaeApplicationAllocationSchema.nullable(),
  documents: z.array(PtbaeApplicationDocumentSchema),
  createdAt: DateTimeStringSchema,
  updatedAt: DateTimeStringSchema,
});

export type PtbaeApplicationType = z.infer<typeof PtbaeApplicationSchema>;
