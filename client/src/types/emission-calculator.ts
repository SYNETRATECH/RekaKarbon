import type { MlAuditResult } from './audit';

export type EmissionScope = 1 | 2 | 3;

export type Scope1ActivityType = 'stationary_combustion' | 'mobile_combustion';
export type Scope2ActivityType = 'purchased_electricity';
export type Scope3ActivityType =
  'flight' | 'hotel' | 'rail' | 'financed_credit' | 'financed_security';

export type EmissionActivityType = Scope1ActivityType | Scope2ActivityType | Scope3ActivityType;

export type CalculationMethod =
  | 'fuel_consumption'
  | 'standard_distance'
  | 'user_distance'
  | 'location_based'
  | 'flight_passenger'
  | 'hotel_room_night'
  | 'rail_distance'
  | 'financed_emissions';

export type ActivityUnit =
  'kg' | 'liter' | 'm3' | 'kwh' | 'km' | 'passenger' | 'room_night' | 'tco2e' | 'idr';

export type Scope1MobileMethod = 'fuel_consumption' | 'distance_travelled';
export type Scope1DistanceMethod = 'standard' | 'user_input';
export type Scope3TravelActivity = 'flight' | 'hotel' | 'rail';
export type FinancedEmissionType = 'credit' | 'security';
export type SecurityInstrumentType = 'government_bond' | 'stock' | 'corporate_bond';

export interface EmissionFactorReference {
  factorCode: string;
  factorSetId: string;
  value: number;
  factorUnit: string;
  sourceName: string;
  sourceDocument: string;
  validYear: number;
}

export interface FuelOption {
  code: string;
  label: string;
  unit: 'liter' | 'kg' | 'm3';
  factor: EmissionFactorReference;
}

export interface ElectricityLocationOption {
  code: string;
  label: string;
  gridCode: string;
  factor: EmissionFactorReference;
}

export interface CountryOption {
  code: string;
  label: string;
  factor: EmissionFactorReference;
}

export interface RailClassOption {
  code: string;
  label: string;
  factor: EmissionFactorReference;
}

export interface CalculationEntryMetadata {
  fuelCode?: string;
  fuelLabel?: string;
  distanceMethod?: Scope1DistanceMethod;
  electricityLocationCode?: string;
  electricityLocationLabel?: string;
  flightType?: 'domestic' | 'international';
  countryCode?: string;
  countryLabel?: string;
  railClassCode?: string;
  railClassLabel?: string;
  financedType?: FinancedEmissionType;
  financedCategory?: string;
  financedEntityName?: string;
  securityInstrument?: SecurityInstrumentType;
  investmentValueIDR?: number;
  issuerDenominatorIDR?: number;
  issuerEmissionsTCO2e?: number;
  sovereignDebtIDR?: number;
  sovereignEmissionsTCO2e?: number;
}

export interface CalculationEntry {
  id: string;
  scope: EmissionScope;
  activityType: EmissionActivityType;
  calculationMethod: CalculationMethod;
  sourceCode: string;
  sourceLabel: string;
  quantity: number;
  unit: ActivityUnit;
  factorCode: string;
  factorSetId: string;
  emissionFactor: number;
  factorUnit: string;
  emissionsTCO2e: number;
  metadata: CalculationEntryMetadata;
}

export interface CalculationData {
  schemaVersion: 2;
  factorSetId: string;
  scope1: number;
  scope2: number;
  scope3: number;
  entries: CalculationEntry[];
}

export interface CalculatorReportSubmission {
  id?: string;
  year?: number;
  merkleRoot: string;
  txHash: string;
  blockchainReportId: number;
  auditResult?: MlAuditResult;
}

export interface CreditCategoryOption {
  code: string;
  label: string;
}

export interface SecurityCategoryOption {
  code: string;
  label: string;
}
