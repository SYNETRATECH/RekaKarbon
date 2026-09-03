import { z } from 'zod';
import {
  UuidSchema,
  EntityIdSchema,
  YearSchema,
  FileSizeBytesSchema,
  DateStringSchema,
  CarbonVolumeSchema,
  PercentageSchema,
  TxHashSchema,
} from './common.schema';

export const SectorBreakdownSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  scope: z.string().min(1),
  emissionsTCO2e: CarbonVolumeSchema,
  percentage: PercentageSchema,
  description: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Format warna hex tidak valid' }),
});

export const CalculationEntrySchema = z.object({
  id: z.string().min(1),
  scope: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  activityType: z.enum([
    'stationary_combustion',
    'mobile_combustion',
    'purchased_electricity',
    'flight',
    'hotel',
    'rail',
    'financed_credit',
    'financed_security',
  ]),
  calculationMethod: z.enum([
    'fuel_consumption',
    'standard_distance',
    'user_distance',
    'location_based',
    'flight_passenger',
    'hotel_room_night',
    'rail_distance',
    'financed_emissions',
  ]),
  sourceCode: z.string().min(1),
  sourceLabel: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  factorCode: z.string().min(1),
  factorSetId: z.string().min(1),
  emissionFactor: z.number().positive(),
  factorUnit: z.string().min(1),
  emissionsTCO2e: CarbonVolumeSchema,
  metadata: z.object({
    fuelCode: z.string().optional(),
    fuelLabel: z.string().optional(),
    distanceMethod: z.enum(['standard', 'user_input']).optional(),
    electricityLocationCode: z.string().optional(),
    electricityLocationLabel: z.string().optional(),
    flightType: z.enum(['domestic', 'international']).optional(),
    countryCode: z.string().optional(),
    countryLabel: z.string().optional(),
    railClassCode: z.string().optional(),
    railClassLabel: z.string().optional(),
    financedType: z.enum(['credit', 'security']).optional(),
    financedCategory: z.string().optional(),
    financedEntityName: z.string().optional(),
    securityInstrument: z.enum(['government_bond', 'stock', 'corporate_bond']).optional(),
    investmentValueIDR: z.number().positive().optional(),
    issuerDenominatorIDR: z.number().positive().optional(),
    issuerEmissionsTCO2e: z.number().positive().optional(),
    sovereignDebtIDR: z.number().positive().optional(),
    sovereignEmissionsTCO2e: z.number().positive().optional(),
  }),
});

export const CalculationDataSchema = z.object({
  schemaVersion: z.literal(2),
  factorSetId: z.string().min(1),
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
  'revision_required',
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
  quotaPTBAETCO2e: CarbonVolumeSchema.nullable().optional(),
  quotaPTBAEStatus: z
    .enum(['VERIFIED', 'PENDING', 'REJECTED', 'EXPIRED', 'LEGACY', 'UNAVAILABLE'])
    .optional(),
  quotaPTBAESourceDocument: z.string().nullable().optional(),
  method: z.enum(['UPLOAD', 'CALCULATOR']).optional(),
  sectorId: z.string().nullable().optional(),
});

export type SectorBreakdownType = z.infer<typeof SectorBreakdownSchema>;
export type CalculationEntryType = z.infer<typeof CalculationEntrySchema>;
export type CalculationDataType = z.infer<typeof CalculationDataSchema>;
export type CalculatorReportSubmissionType = z.infer<typeof CalculatorReportSubmissionSchema>;
export type EmissionReportStatusType = z.infer<typeof EmissionReportStatusSchema>;
export type EmissionReportType = z.infer<typeof EmissionReportSchema>;
