import type {
  CountryOption,
  CreditCategoryOption,
  ElectricityLocationOption,
  EmissionFactorReference,
  FuelOption,
  RailClassOption,
  SecurityCategoryOption,
} from '../types/emission-calculator';

export const CALCULATOR_SCHEMA_VERSION = 2 as const;
export const CALCULATOR_FACTOR_SET_ID = 'rekakarbon-2026-v1';

const factor = (
  factorCode: string,
  value: number,
  factorUnit: string,
  sourceDocument: string
): EmissionFactorReference => ({
  factorCode,
  factorSetId: CALCULATOR_FACTOR_SET_ID,
  value,
  factorUnit,
  sourceName: 'Katalog faktor emisi RekaKarbon',
  sourceDocument,
  validYear: 2026,
});

const fuelFactors = {
  diesel: factor('scope_1_diesel_liter', 2.512, 'kgCO2e/liter', 'Katalog bahan bakar Scope 1'),
  gasoline: factor('scope_1_gasoline_liter', 2.105, 'kgCO2e/liter', 'Katalog bahan bakar Scope 1'),
  coal: factor('scope_1_coal_kg', 2.531, 'kgCO2e/kg', 'Katalog bahan bakar Scope 1'),
  lpg: factor('scope_1_lpg_kg', 2.939, 'kgCO2e/kg', 'Katalog bahan bakar Scope 1'),
  naturalGas: factor('scope_1_natural_gas_m3', 2.023, 'kgCO2e/m3', 'Katalog bahan bakar Scope 1'),
  heavyFuelOil: factor(
    'scope_1_heavy_fuel_oil_liter',
    3.168,
    'kgCO2e/liter',
    'Katalog bahan bakar Scope 1'
  ),
};

export const STATIONARY_FUEL_OPTIONS: FuelOption[] = [
  { code: 'coal', label: 'Batubara', unit: 'kg', factor: fuelFactors.coal },
  { code: 'coal_briquette', label: 'Briket Batubara', unit: 'kg', factor: fuelFactors.coal },
  { code: 'charcoal', label: 'Arang', unit: 'kg', factor: fuelFactors.coal },
  { code: 'natural_gas', label: 'Gas Alam', unit: 'm3', factor: fuelFactors.naturalGas },
  { code: 'lpg', label: 'LPG', unit: 'kg', factor: fuelFactors.lpg },
  { code: 'lgv', label: 'LGV', unit: 'liter', factor: fuelFactors.gasoline },
  { code: 'lng', label: 'LNG', unit: 'kg', factor: fuelFactors.naturalGas },
  { code: 'avtur', label: 'Avtur', unit: 'liter', factor: fuelFactors.diesel },
  { code: 'kerosene', label: 'Minyak Tanah', unit: 'liter', factor: fuelFactors.diesel },
  { code: 'diesel_cn53', label: 'Minyak Solar CN53', unit: 'liter', factor: fuelFactors.diesel },
  { code: 'diesel_cn51', label: 'Minyak Solar CN51', unit: 'liter', factor: fuelFactors.diesel },
  { code: 'diesel_cn48', label: 'Minyak Solar CN48', unit: 'liter', factor: fuelFactors.diesel },
  { code: 'diesel', label: 'Minyak Diesel', unit: 'liter', factor: fuelFactors.diesel },
  { code: 'fuel_oil', label: 'Minyak Bakar', unit: 'liter', factor: fuelFactors.heavyFuelOil },
  { code: 'gasoline_ron98', label: 'Bensin RON98', unit: 'liter', factor: fuelFactors.gasoline },
  { code: 'gasoline_ron92', label: 'Bensin RON92', unit: 'liter', factor: fuelFactors.gasoline },
  { code: 'gasoline_ron90', label: 'Bensin RON90', unit: 'liter', factor: fuelFactors.gasoline },
  { code: 'gasoline_ron88', label: 'Bensin RON88', unit: 'liter', factor: fuelFactors.gasoline },
];

export const MOBILE_FUEL_OPTIONS = STATIONARY_FUEL_OPTIONS.filter((fuel) =>
  [
    'diesel_cn53',
    'diesel_cn51',
    'diesel_cn48',
    'gasoline_ron98',
    'gasoline_ron92',
    'gasoline_ron90',
    'gasoline_ron88',
  ].includes(fuel.code)
);

const gridFactor = factor(
  'scope_2_grid_electricity',
  0.207,
  'kgCO2e/kWh',
  'Katalog sistem kelistrikan RekaKarbon'
);

const INDONESIAN_CITIES = [
  ['jakarta', 'Jakarta'],
  ['bandung', 'Bandung'],
  ['semarang', 'Semarang'],
  ['yogyakarta', 'Yogyakarta'],
  ['surabaya', 'Surabaya'],
  ['malang', 'Malang'],
  ['denpasar', 'Denpasar'],
  ['medan', 'Medan'],
  ['pekanbaru', 'Pekanbaru'],
  ['palembang', 'Palembang'],
  ['bandar_lampung', 'Bandar Lampung'],
  ['pontianak', 'Pontianak'],
  ['banjarmasin', 'Banjarmasin'],
  ['balikpapan', 'Balikpapan'],
  ['samarinda', 'Samarinda'],
  ['makassar', 'Makassar'],
  ['manado', 'Manado'],
  ['mataram', 'Mataram'],
  ['kupang', 'Kupang'],
  ['ambon', 'Ambon'],
  ['jayapura', 'Jayapura'],
] as const;

export const ELECTRICITY_LOCATION_OPTIONS: ElectricityLocationOption[] = INDONESIAN_CITIES.map(
  ([code, label]) => ({
    code,
    label,
    gridCode: 'indonesia_grid_general',
    factor: gridFactor,
  })
);

const countryFactor = factor(
  'scope_3_hotel_room_night',
  10,
  'kgCO2e/room-night',
  'Katalog akomodasi Scope 3 RekaKarbon'
);

const COUNTRIES = [
  ['ID', 'Indonesia'],
  ['SG', 'Singapura'],
  ['MY', 'Malaysia'],
  ['TH', 'Thailand'],
  ['VN', 'Vietnam'],
  ['PH', 'Filipina'],
  ['JP', 'Jepang'],
  ['KR', 'Korea Selatan'],
  ['CN', 'Tiongkok'],
  ['IN', 'India'],
  ['AU', 'Australia'],
  ['NZ', 'Selandia Baru'],
  ['SA', 'Arab Saudi'],
  ['AE', 'Uni Emirat Arab'],
  ['GB', 'Britania Raya'],
  ['DE', 'Jerman'],
  ['FR', 'Prancis'],
  ['NL', 'Belanda'],
  ['IT', 'Italia'],
  ['US', 'Amerika Serikat'],
  ['CA', 'Kanada'],
  ['BR', 'Brasil'],
  ['ZA', 'Afrika Selatan'],
] as const;

export const COUNTRY_OPTIONS: CountryOption[] = COUNTRIES.map(([code, label]) => ({
  code,
  label,
  factor: countryFactor,
}));

const railFactor = factor(
  'scope_3_rail_distance',
  0.041,
  'kgCO2e/km',
  'Katalog transportasi Scope 3 RekaKarbon'
);

export const RAIL_CLASS_OPTIONS: RailClassOption[] = [
  ['economy', 'Kereta Api Kelas Ekonomi'],
  ['business', 'Kereta Api Kelas Bisnis'],
  ['executive', 'Kereta Api Kelas Eksekutif'],
  ['panoramic', 'Kereta Api Kelas Panoramic'],
  ['luxury', 'Kereta Api Kelas Luxury'],
  ['priority', 'Kereta Api Kelas Priority'],
  ['compartment', 'Kereta Api Kelas Compartment'],
].map(([code, label]) => ({ code, label, factor: railFactor }));

export const CREDIT_CATEGORY_OPTIONS: CreditCategoryOption[] = [
  {
    code: 'business_project_reported_emissions',
    label: 'Kredit Usaha/Proyek (Berdasarkan Emisi yang Dilaporkan)',
  },
  {
    code: 'business_economic_activity',
    label: 'Kredit Usaha (Berdasarkan Emisi Aktivitas Ekonomi)',
  },
  { code: 'motor_vehicle', label: 'Kredit Kendaraan Bermotor' },
  { code: 'property', label: 'Kredit Properti' },
];

export const SECURITY_CATEGORY_OPTIONS: SecurityCategoryOption[] = [
  { code: 'government_bond', label: 'Surat Berharga Negara' },
  { code: 'stock', label: 'Saham' },
  { code: 'corporate_bond', label: 'Obligasi' },
];

export const FLIGHT_FACTORS = {
  domestic: factor(
    'scope_3_flight_domestic',
    0.244,
    'kgCO2e/passenger',
    'Katalog perjalanan Scope 3 RekaKarbon'
  ),
  international: factor(
    'scope_3_flight_international',
    0.315,
    'kgCO2e/passenger',
    'Katalog perjalanan Scope 3 RekaKarbon'
  ),
} as const;

export const FINANCED_EMISSION_FACTOR = factor(
  'scope_3_financed_direct_input',
  1000,
  'kgCO2e/tCO2e',
  'Input emisi entitas yang dibiayai'
);

export function getFuelOption(code: string): FuelOption | undefined {
  return STATIONARY_FUEL_OPTIONS.find((fuel) => fuel.code === code);
}

export function getMobileFuelOption(code: string): FuelOption | undefined {
  return MOBILE_FUEL_OPTIONS.find((fuel) => fuel.code === code);
}

export function getElectricityLocation(code: string): ElectricityLocationOption | undefined {
  return ELECTRICITY_LOCATION_OPTIONS.find((location) => location.code === code);
}

export function getCountryOption(code: string): CountryOption | undefined {
  return COUNTRY_OPTIONS.find((country) => country.code === code);
}

export function getRailClassOption(code: string): RailClassOption | undefined {
  return RAIL_CLASS_OPTIONS.find((railClass) => railClass.code === code);
}
