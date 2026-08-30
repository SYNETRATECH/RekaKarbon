import { z } from 'zod';
import {
  UuidSchema,
  NpwpSchema,
  CarbonVolumeSchema,
  IdrAmountSchema,
  YearSchema,
  DateStringSchema,
  DateTimeStringSchema,
} from './common.schema';

export const CarbonTaxCalculationSchema = z.object({
  companyId: UuidSchema,
  companyName: z.string().min(1),
  npwp: NpwpSchema,
  actualEmissionTCO2e: CarbonVolumeSchema,
  quotaPTBAETCO2e: CarbonVolumeSchema,
  deficitTCO2e: CarbonVolumeSchema,
  taxRatePerTonIDR: IdrAmountSchema,
  totalTaxPayableIDR: IdrAmountSchema,
  governingRegulation: z.string().min(1),
  calculatedAt: DateTimeStringSchema,
});

export const StpDocumentSchema = z.object({
  id: UuidSchema,
  stpDocNumber: z.string().min(1),
  companyId: UuidSchema,
  companyName: z.string().min(1),
  npwp: NpwpSchema,
  taxYear: YearSchema,
  totalTaxDueIDR: IdrAmountSchema,
  dueDate: DateStringSchema,
  paymentStatus: z.enum(['unpaid', 'paid', 'overdue']),
  issuedAt: DateTimeStringSchema,
});

export const CalculateTaxDtoSchema = z.object({
  companyId: UuidSchema,
  actualEmissionTCO2e: CarbonVolumeSchema,
  quotaPTBAETCO2e: CarbonVolumeSchema,
  taxRatePerTonIDR: IdrAmountSchema.optional(),
});

export const IssueStpDtoSchema = z.object({
  companyId: UuidSchema,
  taxYear: YearSchema,
  totalTaxDueIDR: IdrAmountSchema,
});

export type CarbonTaxCalculationType = z.infer<typeof CarbonTaxCalculationSchema>;
export type StpDocumentType = z.infer<typeof StpDocumentSchema>;
export type CalculateTaxDtoType = z.infer<typeof CalculateTaxDtoSchema>;
export type IssueStpDtoType = z.infer<typeof IssueStpDtoSchema>;
