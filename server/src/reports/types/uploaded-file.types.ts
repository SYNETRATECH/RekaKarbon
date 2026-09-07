export interface ReportUploadedFileData {
  originalFileName: string;
  fileSizeBytes: bigint;
  mimeType: string;
  storageKey: string;
  accessUrl: string;
  fileHash: string;
  category: 'EMISSION_REPORT';
}
