export interface SectorBreakdown {
  id: string;
  name: string; // e.g. "Scope 1 - Pembakaran Langsung"
  scope: string; // "Scope 1" | "Scope 2" | "Scope 3" | "Proses Industri"
  emissionsTCO2e: number;
  percentage: number;
  description: string;
  color: string;
}

export interface CalculationEntry {
  id: string;
  value: number;
}

export interface CalculationData {
  scope1: number;
  scope2: number;
  scope3: number;
  entries: CalculationEntry[];
}

export interface CalculatorReportSubmission {
  merkleRoot: string;
  txHash: string;
  blockchainReportId: number;
}

export interface EmissionReport {
  id: string;
  year: number;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  uploadDate: string;
  status: 'verified' | 'approved' | 'submitted' | 'rejected' | 'audit_in_progress' | 'draft';
  totalEmissionsTCO2e: number;
  sectors: SectorBreakdown[];
  blockchainTxHash?: string | null;
  blockchainReportId?: number | null;
  merkleRoot?: string | null;
  method?: 'UPLOAD' | 'CALCULATOR';
  sectorId?: string | null;
}
