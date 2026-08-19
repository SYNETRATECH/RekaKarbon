export interface SectorBreakdown {
  id: string;
  name: string; // e.g. "Scope 1 - Pembakaran Langsung"
  scope: string; // "Scope 1" | "Scope 2" | "Scope 3" | "Proses Industri"
  emissionsTCO2e: number;
  percentage: number;
  description: string;
  color: string;
}

export interface EmissionReport {
  id: string;
  year: number;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  uploadDate: string;
  status: 'verified' | 'audit_in_progress' | 'draft';
  totalEmissionsTCO2e: number;
  sectors: SectorBreakdown[];
}
