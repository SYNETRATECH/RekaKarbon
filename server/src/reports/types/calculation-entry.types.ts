import type { Prisma } from '@prisma/client';
import type {
  CalculatorActivityType,
  CalculatorCalculationMethod,
} from './calculator-activity.types';

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
