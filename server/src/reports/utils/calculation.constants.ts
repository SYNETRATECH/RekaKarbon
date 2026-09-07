import type {
  CalculatorActivityType,
  CalculatorCalculationMethod,
} from '../types';

export const FACTOR_SET_ID = 'rekakarbon-2026-v1';

export const CARBON_OFFSET_RATE_IDR = 650_000;

export const ACTIVITY_TYPES: readonly CalculatorActivityType[] = [
  'stationary_combustion',
  'mobile_combustion',
  'purchased_electricity',
  'flight',
  'hotel',
  'rail',
  'financed_credit',
  'financed_security',
];

export const CALCULATION_METHODS: readonly CalculatorCalculationMethod[] = [
  'fuel_consumption',
  'standard_distance',
  'user_distance',
  'location_based',
  'flight_passenger',
  'hotel_room_night',
  'rail_distance',
  'financed_emissions',
];

export const STANDARD_EMISSION_FACTORS: Record<
  string,
  { value: number; unit: string }
> = {
  coal: { value: 2.531, unit: 'kgCO2e/kg' },
  coal_briquette: { value: 2.531, unit: 'kgCO2e/kg' },
  charcoal: { value: 2.531, unit: 'kgCO2e/kg' },
  natural_gas: { value: 2.023, unit: 'kgCO2e/m3' },
  lpg: { value: 2.939, unit: 'kgCO2e/kg' },
  lgV: { value: 2.105, unit: 'kgCO2e/liter' },
  lgv: { value: 2.105, unit: 'kgCO2e/liter' },
  lng: { value: 2.023, unit: 'kgCO2e/kg' },
  avtur: { value: 2.512, unit: 'kgCO2e/liter' },
  kerosene: { value: 2.512, unit: 'kgCO2e/liter' },
  diesel: { value: 2.512, unit: 'kgCO2e/liter' },
  diesel_cn53: { value: 2.512, unit: 'kgCO2e/liter' },
  diesel_cn51: { value: 2.512, unit: 'kgCO2e/liter' },
  diesel_cn48: { value: 2.512, unit: 'kgCO2e/liter' },
  fuel_oil: { value: 3.168, unit: 'kgCO2e/liter' },
  gasoline_ron98: { value: 2.105, unit: 'kgCO2e/liter' },
  gasoline_ron92: { value: 2.105, unit: 'kgCO2e/liter' },
  gasoline_ron90: { value: 2.105, unit: 'kgCO2e/liter' },
  gasoline_ron88: { value: 2.105, unit: 'kgCO2e/liter' },
};

export const SCOPE_SECTOR_METADATA = {
  scope1: {
    name: 'Scope 1 (Pembakaran & Operasional)',
    scope: 'Scope 1',
    description: 'Emisi langsung dari operasional',
    color: '#ef4444',
  },
  scope2: {
    name: 'Scope 2 (Listrik)',
    scope: 'Scope 2',
    description: 'Emisi dari penggunaan listrik',
    color: '#f59e0b',
  },
  scope3: {
    name: 'Scope 3 (Rantai Pasok)',
    scope: 'Scope 3',
    description: 'Emisi dari rantai pasok dan operasional eksternal',
    color: '#3b82f6',
  },
} as const;
