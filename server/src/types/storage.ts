export type FileCategory =
  | 'emission_report'
  | 'legal_sk'
  | 'drone_ortho'
  | 'drone_lidar'
  | 'spatial_geojson'
  | 'audit_proof';

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
