import { z } from 'zod';
import {
  CarbonVolumeSchema,
  DateTimeStringSchema,
  FileSizeBytesSchema,
  UuidSchema,
} from './common.schema';

export const EmissionReportAuditStatusSchema = z.enum([
  'submitted',
  'revision_required',
  'approved',
  'rejected',
]);

export const EmissionReportAuditActionSchema = z.enum([
  'submitted',
  'request_revision',
  'resubmitted',
  'approved',
]);

export const EmissionReportAuditListItemSchema = z.object({
  id: UuidSchema,
  companyId: UuidSchema,
  companyName: z.string().min(1),
  year: z.number().int(),
  sector: z.string().nullable(),
  totalEmissionsTCO2e: CarbonVolumeSchema,
  reportMethod: z.string().min(1),
  status: EmissionReportAuditStatusSchema,
  revisionNumber: z.number().int().nonnegative(),
  submittedAt: DateTimeStringSchema,
  fileCount: z.number().int().nonnegative(),
  merkleRoot: z.string().min(1),
  blockchainTxHash: z.string().nullable(),
});

export const EmissionReportAuditFileSchema = z.object({
  id: UuidSchema,
  originalFileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSizeBytes: FileSizeBytesSchema,
  accessUrl: z.string().url(),
  contentHash: z.string().nullable(),
});

export const EmissionReportAuditHistoryItemSchema = z.object({
  id: UuidSchema,
  action: EmissionReportAuditActionSchema,
  fromStatus: EmissionReportAuditStatusSchema.nullable(),
  toStatus: EmissionReportAuditStatusSchema,
  notes: z.string().nullable(),
  merkleRoot: z.string().nullable(),
  blockchainTxHash: z.string().nullable(),
  actorName: z.string().min(1),
  createdAt: DateTimeStringSchema,
});

export const EmissionReportAuditDetailSchema = EmissionReportAuditListItemSchema.extend({
  facilityRegion: z.string(),
  calculationData: z.unknown(),
  auditedAt: DateTimeStringSchema.nullable(),
  auditorNotes: z.string().nullable(),
  auditBlockchainTxHash: z.string().nullable(),
  auditAnchorStatus: z.enum(['pending', 'processing', 'confirmed', 'failed']).nullable(),
  files: z.array(EmissionReportAuditFileSchema),
  auditHistory: z.array(EmissionReportAuditHistoryItemSchema),
});

export type EmissionReportAuditListItemType = z.infer<typeof EmissionReportAuditListItemSchema>;
export type EmissionReportAuditDetailType = z.infer<typeof EmissionReportAuditDetailSchema>;
