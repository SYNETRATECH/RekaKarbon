import { z } from 'zod';
import { UuidSchema, PercentageSchema, DateTimeStringSchema } from './common.schema';

export const CemsReadingSchema = z.object({
  id: z.string().min(1),
  companyId: UuidSchema,
  companyName: z.string().min(1),
  stackId: z.string().min(1),
  co2Ppm: z.number().nonnegative(),
  so2MgM3: z.number().nonnegative(),
  noxMgM3: z.number().nonnegative(),
  flowRateM3Sec: z.number().nonnegative(),
  temperatureC: z.number().min(-50).max(1500),
  timestamp: DateTimeStringSchema,
  isAnomaly: z.boolean(),
});

export const ForestSensorReadingSchema = z.object({
  id: z.string().min(1),
  projectId: UuidSchema,
  projectName: z.string().min(1),
  nodeId: z.string().min(1),
  canopyMoisturePercent: PercentageSchema,
  soilMoisturePercent: PercentageSchema,
  ambientTempC: z.number().min(-50).max(100),
  solarRadiationWPerm2: z.number().nonnegative(),
  timestamp: DateTimeStringSchema,
});

export const CemsTelemetryDtoSchema = z.object({
  companyId: UuidSchema,
  stackId: z.string().min(1),
  co2Ppm: z.number().nonnegative(),
  so2MgM3: z.number().nonnegative(),
  noxMgM3: z.number().nonnegative(),
  flowRateM3Sec: z.number().nonnegative(),
  temperatureC: z.number().min(-50).max(1500),
});

export const ForestSensorTelemetryDtoSchema = z.object({
  projectId: UuidSchema,
  nodeId: z.string().min(1),
  canopyMoisturePercent: PercentageSchema,
  soilMoisturePercent: PercentageSchema,
  ambientTempC: z.number().min(-50).max(100),
  solarRadiationWPerm2: z.number().nonnegative(),
});

export type CemsReadingType = z.infer<typeof CemsReadingSchema>;
export type ForestSensorReadingType = z.infer<typeof ForestSensorReadingSchema>;
export type CemsTelemetryDtoType = z.infer<typeof CemsTelemetryDtoSchema>;
export type ForestSensorTelemetryDtoType = z.infer<typeof ForestSensorTelemetryDtoSchema>;
