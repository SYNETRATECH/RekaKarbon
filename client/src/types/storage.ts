export type FileCategory =
  'legal_sk' | 'emission_report' | 'drone_raw' | 'orthophoto' | 'kyb_document' | 'tax_invoice';

export interface StoredFile {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  accessUrl: string;
  uploadedBy: string;
  category: FileCategory;
  uploadedAt: string;
}

export interface UploadFileDto {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  category: FileCategory;
}
