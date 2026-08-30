import type { Prisma } from '@prisma/client';

export interface SectorBreakdown {
  id: string;
  name: string;
  scope: string;
  emissionsTCO2e: number;
  percentage: number;
  description: string;
  color: string;
}

export interface CalculationEntry extends Prisma.InputJsonObject {
  id: string;
  value: number;
}

export interface CalculatorCalculationData extends Prisma.InputJsonObject {
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
  uploadDate: string;
  status: 'verified' | 'audit_in_progress' | 'draft';
  totalEmissionsTCO2e: number;
  sectors: SectorBreakdown[];
}
