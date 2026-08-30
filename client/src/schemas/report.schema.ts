import { z } from 'zod';
import {
  UuidSchema,
  YearSchema,
  FileSizeBytesSchema,
  DateStringSchema,
  CarbonVolumeSchema,
  PercentageSchema,
  TxHashSchema,
} from './common.schema';

export const SectorBreakdownSchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  scope: z.string().min(1),
  emissionsTCO2e: CarbonVolumeSchema,
  percentage: PercentageSchema,
  description: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Format warna hex tidak valid' }),
});

export const CalculationEntrySchema = z.object({
  id: z.string().min(1),
  value: z.number().nonnegative(),
});

export const CalculationDataSchema = z.object({
  scope1: CarbonVolumeSchema,
  scope2: CarbonVolumeSchema,
  scope3: CarbonVolumeSchema,
  entries: z.array(CalculationEntrySchema),
});

export const CalculatorReportSubmissionSchema = z.object({
  merkleRoot: z.string().min(1),
  txHash: TxHashSchema,
  blockchainReportId: z.number().int().nonnegative(),
});

export const EmissionReportStatusSchema = z.enum([
  'verified',
  'approved',
  'submitted',
  'rejected',
  'audit_in_progress',
  'draft',
]);

export const EmissionReportSchema = z.object({
  id: UuidSchema,
  year: YearSchema,
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileSizeBytes: FileSizeBytesSchema,
  uploadDate: DateStringSchema,
  status: EmissionReportStatusSchema,
  totalEmissionsTCO2e: CarbonVolumeSchema,
  sectors: z.array(SectorBreakdownSchema),
  blockchainTxHash: TxHashSchema.nullable().optional(),
  blockchainReportId: z.number().int().nonnegative().nullable().optional(),
  merkleRoot: z.string().nullable().optional(),
  method: z.enum(['UPLOAD', 'CALCULATOR']).optional(),
  sectorId: z.string().nullable().optional(),
});

export type SectorBreakdownType = z.infer<typeof SectorBreakdownSchema>;
export type CalculationEntryType = z.infer<typeof CalculationEntrySchema>;
export type CalculationDataType = z.infer<typeof CalculationDataSchema>;
export type CalculatorReportSubmissionType = z.infer<typeof CalculatorReportSubmissionSchema>;
export type EmissionReportStatusType = z.infer<typeof EmissionReportStatusSchema>;
export type EmissionReportType = z.infer<typeof EmissionReportSchema>;
