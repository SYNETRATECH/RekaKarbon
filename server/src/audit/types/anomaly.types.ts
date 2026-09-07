import type { MlAuditResult } from './ml-audit.types';

export interface AnomalySummary {
  emitenTerdeteksiAnomali: number;
  totalEmitenAktif: number;
  rataDeviasiEmisi: number;
  descDeviasi: string;
  eFakturTidakCocok: number;
  descEFaktur: string;
}

export interface EnergyCorrelationItem {
  name: string;
  reported: number;
  estimated: number;
}

export interface AiAnomalyLog {
  id: string;
  company: string;
  companyId?: string;
  sector: string;
  year?: number;
  emissionReportId?: string;
  auditResult?: MlAuditResult | null;
  anomalyScore: number;
  trustScore?: number;
  divergencePercent?: number;
  scoreDjp?: number;
  scoreBbm?: number;
  scoreCems?: number;
  isAnomaly?: boolean;
  deltaElectricity?: number;
  deltaCoal?: number;
  deltaGas?: number;
  eFakturMatch: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reportedEmission: number;
  estimatedEmission: number;
  desc: string;
  auditStatus:
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'submitted'
    | 'approved'
    | 'revision_required';
}
