import type { Prisma } from '@prisma/client';
import type { PtbaeQuotaStatus } from '../../compliance/types';
import type { MlAuditResult } from '../../audit/types/ml-audit.types';

export interface SectorBreakdown {
  id: string;
  name: string;
  scope: string;
  emissionsTCO2e: number;
  percentage: number;
  description: string;
  color: string;
}

export type CalculatorActivityType =
  | 'stationary_combustion'
  | 'mobile_combustion'
  | 'purchased_electricity'
  | 'flight'
  | 'hotel'
  | 'rail'
  | 'financed_credit'
  | 'financed_security';

export type CalculatorCalculationMethod =
  | 'fuel_consumption'
  | 'standard_distance'
  | 'user_distance'
  | 'location_based'
  | 'flight_passenger'
  | 'hotel_room_night'
  | 'rail_distance'
  | 'financed_emissions';

export interface CalculationEntry extends Prisma.InputJsonObject {
  id: string;
  scope: 1 | 2 | 3;
  activityType: CalculatorActivityType;
  calculationMethod: CalculatorCalculationMethod;
  sourceCode: string;
  sourceLabel: string;
  quantity: number;
  unit: string;
  factorCode: string;
  factorSetId: string;
  emissionFactor: number;
  factorUnit: string;
  emissionsTCO2e: number;
  metadata: Prisma.InputJsonObject;
}

export interface CalculatorCalculationData extends Prisma.InputJsonObject {
  schemaVersion: number;
  factorSetId: string;
  scope1: number;
  scope2: number;
  scope3: number;
  entries: CalculationEntry[];
}

export interface EmissionReport {
  id: string;
  year: number;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  status:
    | 'verified'
    | 'approved'
    | 'submitted'
    | 'revision_required'
    | 'rejected'
    | 'audit_in_progress'
    | 'draft';
  quotaPTBAETCO2e: number | null;
  quotaPTBAEStatus: PtbaeQuotaStatus;
  quotaPTBAESourceDocument: string | null;
  sectors: SectorBreakdown[];
  method?: string;
  sectorId?: string | null;
  calculationData?: unknown;
  auditResult?: MlAuditResult | null;
  merkleRoot?: string | null;
  blockchainTxHash?: string | null;
  blockchainReportId?: number | null;
}
