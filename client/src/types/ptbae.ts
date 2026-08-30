import type { PtbaeQuotaStatus } from './compliance';

export interface PtbaeAllocation {
  complianceYear: number;
  quotaTCO2e: number;
  status: PtbaeQuotaStatus;
  sourceDocument: string;
}
