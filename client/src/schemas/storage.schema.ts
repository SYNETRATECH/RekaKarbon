import { z } from 'zod';
import { UuidSchema, FileSizeBytesSchema, DateTimeStringSchema } from './common.schema';

export const FileCategorySchema = z.enum([
  'legal_sk',
  'emission_report',
  'drone_raw',
  'orthophoto',
  'kyb_document',
  'tax_invoice',
]);

export const StoredFileSchema = z.object({
  id: UuidSchema,
  originalFileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSizeBytes: FileSizeBytesSchema,
  storageKey: z.string().min(1),
  accessUrl: z.string().min(1),
  uploadedBy: z.string(),
  category: FileCategorySchema,
  uploadedAt: DateTimeStringSchema,
});

export const UploadFileDtoSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSizeBytes: FileSizeBytesSchema,
  category: FileCategorySchema,
});

export type FileCategoryType = z.infer<typeof FileCategorySchema>;
export type StoredFileType = z.infer<typeof StoredFileSchema>;
export type UploadFileDtoType = z.infer<typeof UploadFileDtoSchema>;
