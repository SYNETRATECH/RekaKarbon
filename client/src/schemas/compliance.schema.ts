import { z } from 'zod';
import { CarbonVolumeSchema, IdrAmountSchema, MetricPercentageSchema } from './common.schema';

export const AnnualChartPointSchema = z.object({
  year: z.string().regex(/^\d{4}$/, { message: 'Tahun harus 4 digit' }),
  historis: z.number().nonnegative().optional(),
  proyeksi: z.number().nonnegative().optional(),
  label: z.string().optional(),
});

export const PtbaeQuotaStatusSchema = z.enum([
  'VERIFIED',
  'PENDING',
  'REJECTED',
  'EXPIRED',
  'LEGACY',
  'UNAVAILABLE',
]);

export const ComplianceDataSchema = z.object({
  complianceYear: z.number().int().positive(),
  emissionVsQuotaPercent: MetricPercentageSchema,
  emissionIntensity: z.number().nonnegative(),
  emissionIntensityStandard: z.number().nonnegative(),
  carbonDeficit: CarbonVolumeSchema,
  actualEmissions: CarbonVolumeSchema,
  quotaPTBAE: CarbonVolumeSchema,
  quotaPTBAEStatus: PtbaeQuotaStatusSchema,
  quotaPTBAESourceDocument: z.string().nullable(),
  governedBy: z.string().min(1),
  administrativeSanction: z.string().min(1),
  djpReportStatus: z.string().min(1),
  annualProductionVolume: z.number().nonnegative(),
  carbonPricePerTon: IdrAmountSchema,
  totalEstimatedCostIDR: IdrAmountSchema,
  annualHistory: z.array(AnnualChartPointSchema),
});

export type AnnualChartPointType = z.infer<typeof AnnualChartPointSchema>;
export type ComplianceDataType = z.infer<typeof ComplianceDataSchema>;
