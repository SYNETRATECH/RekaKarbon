import type { Prisma } from '@prisma/client';
import type { CalculationEntry } from './calculation-entry.types';

export interface CalculatorCalculationData extends Prisma.InputJsonObject {
  schemaVersion: number;
  factorSetId: string;
  scope1: number;
  scope2: number;
  scope3: number;
  entries: CalculationEntry[];
}

export type CalculatorScopeData = Partial<CalculatorCalculationData>;
