import { z } from 'zod';
import {
  UuidSchema,
  LatitudeSchema,
  LongitudeSchema,
  CarbonVolumeSchema,
  IdrAmountSchema,
  DateStringSchema,
} from './common.schema';

export const CompanyComplianceRatingSchema = z.enum(['non_compliant', 'warning', 'compliant']);

export const CompanyPaymentStatusSchema = z.enum(['unpaid', 'paid']);

export const CompanySchema = z.object({
  id: UuidSchema,
  name: z.string().min(1),
  sector: z.string().min(1),
  region: z.string().min(1),
  center: z.tuple([LatitudeSchema, LongitudeSchema]),
  zoom: z.number().int().min(1).max(22),
  emissionCap: CarbonVolumeSchema,
  actualEmission: CarbonVolumeSchema,
  carbonDeficit: CarbonVolumeSchema,
  paymentStatus: CompanyPaymentStatusSchema,
  offsetCostIDR: IdrAmountSchema,
  auditDate: DateStringSchema,
  paymentDeadline: DateStringSchema.optional(),
  paymentDate: DateStringSchema.optional(),
  stackSensors: z.string(),
  complianceRating: CompanyComplianceRatingSchema,
  recommendedPartner: z.string().min(1),
  picAuditor: z.string().min(1),
  description: z.string(),
  originalCarbonDeficit: CarbonVolumeSchema.optional(),
  originalOffsetCostIDR: IdrAmountSchema.optional(),
});

export type CompanyType = z.infer<typeof CompanySchema>;
