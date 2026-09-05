import { z } from 'zod';
import {
  CarbonVolumeSchema,
  DateTimeStringSchema,
  HectaresSchema,
  UuidSchema,
} from './common.schema';
import { ForestInspectionCheckpointSchema } from './regulator.schema';

export const KthForestProjectStatusSchema = z.enum(['draft', 'active_dmrv', 'audited', 'minted']);

export const KthForestProjectSchema = z.object({
  id: UuidSchema,
  projectName: z.string().min(1),
  province: z.string().min(1),
  areaHectares: HectaresSchema,
  targetSequestrationTCO2e: CarbonVolumeSchema,
  actualSequestrationTCO2e: CarbonVolumeSchema,
  carbonStockTCO2e: CarbonVolumeSchema,
  status: KthForestProjectStatusSchema,
  inspectionTimeline: z.array(ForestInspectionCheckpointSchema).default([]),
});

export const KthDmrvSubmissionResultSchema = z.object({
  projectId: UuidSchema,
  projectName: z.string().min(1),
  landName: z.string().min(1),
  areaHectares: HectaresSchema,
  estimatedCarbonTCO2e: CarbonVolumeSchema,
  actualSequestrationTCO2e: CarbonVolumeSchema,
  carbonStockTCO2e: CarbonVolumeSchema,
  status: KthForestProjectStatusSchema,
  submittedAt: DateTimeStringSchema,
  checkpointId: UuidSchema,
  checkpointTitle: z.string().min(1),
  snapshotHash: z.string().min(1),
});

export type KthForestProjectSchemaType = z.infer<typeof KthForestProjectSchema>;
export type KthDmrvSubmissionResultSchemaType = z.infer<typeof KthDmrvSubmissionResultSchema>;
