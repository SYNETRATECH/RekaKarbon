import type { CalculatorCalculationData } from '../../src/reports/types/report.types';

export interface ReportAuditTestScenario {
  id: string;
  name: string;
  description: string;
  sector: string;
  year: number;
  totalEmissions: number;
  calculationData: CalculatorCalculationData;
  expectedVerdict: 'PASS_VERIFIED' | 'REJECT_ANOMALY';
  expectedIsAnomaly: boolean;
  expectedMinTrustScore?: number;
  expectedMaxTrustScore?: number;
  expectedFlags?: string[];
}

export const SCENARIO_1_COMPLIANT_MANUFACTURING: ReportAuditTestScenario = {
  id: 'SCENARIO_1_COMPLIANT_MANUFACTURING',
  name: 'Laporan Manufaktur Selaras (Pass Verified)',
  description:
    'Pabrik manufaktur dengan konsumsi solar 50.000 L dan listrik PLN 200.000 kWh yang selaras dengan stoikiometri fisik.',
  sector: 'manufaktur',
  year: 2026,
  totalEmissions: 290.8,
  calculationData: {
    schemaVersion: 2,
    factorSetId: 'rekakarbon-2026-v1',
    scope1: 134.0,
    scope2: 156.8,
    scope3: 0,
    entries: [
      {
        id: 'entry-sc1-solar',
        scope: 1,
        activityType: 'stationary_combustion',
        calculationMethod: 'fuel_consumption',
        sourceCode: 'diesel',
        sourceLabel: 'Minyak Solar Industri',
        quantity: 50000,
        unit: 'liter',
        factorCode: 'diesel',
        factorSetId: 'rekakarbon-2026-v1',
        emissionFactor: 2.512,
        factorUnit: 'kgCO2e/liter',
        emissionsTCO2e: 125.6,
        metadata: {
          fuelCode: 'solar_diesel',
          fuelLabel: 'Minyak Solar B35 Industri',
        },
      },
      {
        id: 'entry-sc1-pln',
        scope: 2,
        activityType: 'purchased_electricity',
        calculationMethod: 'location_based',
        sourceCode: 'pln_grid_jamali',
        sourceLabel: 'Listrik Grid PLN Jamali',
        quantity: 200000,
        unit: 'kwh',
        factorCode: 'grid_jamali',
        factorSetId: 'rekakarbon-2026-v1',
        emissionFactor: 0.784,
        factorUnit: 'kgCO2e/kWh',
        emissionsTCO2e: 156.8,
        metadata: {
          electricityLocationCode: 'ID-JB',
          electricityLocationLabel: 'Jawa Barat',
        },
      },
    ],
  },
  expectedVerdict: 'PASS_VERIFIED',
  expectedIsAnomaly: false,
  expectedMinTrustScore: 80.0,
  expectedFlags: [],
};

export const SCENARIO_2_STOICHIOMETRIC_UNDERREPORTING: ReportAuditTestScenario =
  {
    id: 'SCENARIO_2_STOICHIOMETRIC_UNDERREPORTING',
    name: 'Under-reporting dan Deviasi Stoikiometri Ekstrem',
    description:
      'Emiten membakar 500.000 L solar (~1.340 tCO2e fisik) namun hanya melaporkan 150 tCO2e.',
    sector: 'manufaktur',
    year: 2026,
    totalEmissions: 150.0, // Severely depressed compared to physical 500,000 L solar
    calculationData: {
      schemaVersion: 2,
      factorSetId: 'rekakarbon-2026-v1',
      scope1: 150.0,
      scope2: 0,
      scope3: 0,
      entries: [
        {
          id: 'entry-sc2-solar-fraud',
          scope: 1,
          activityType: 'stationary_combustion',
          calculationMethod: 'fuel_consumption',
          sourceCode: 'diesel',
          sourceLabel: 'Minyak Solar Industri',
          quantity: 500000,
          unit: 'liter',
          factorCode: 'diesel',
          factorSetId: 'rekakarbon-2026-v1',
          emissionFactor: 2.512,
          factorUnit: 'kgCO2e/liter',
          emissionsTCO2e: 150.0,
          metadata: {
            fuelCode: 'solar_diesel',
            fuelLabel: 'Minyak Solar B35 Industri',
          },
        },
      ],
    },
    expectedVerdict: 'REJECT_ANOMALY',
    expectedIsAnomaly: true,
    expectedMaxTrustScore: 65.0,
    expectedFlags: [
      'UNDER_REPORTING_TERINDIKASI',
      'DEVIASI_FISIK_DAN_LAPORAN_TINGGI',
    ],
  };

export const SCENARIO_3_FISCAL_PRICE_ANOMALY: ReportAuditTestScenario = {
  id: 'SCENARIO_3_FISCAL_PRICE_ANOMALY',
  name: 'Anomali Indeks Harga Pembelian Solar DJP',
  description:
    'Pembelian solar dengan harga terindikasi abnormal / manipulasi e-Faktur di luar koridor DJP.',
  sector: 'cpo',
  year: 2026,
  totalEmissions: 402.0,
  calculationData: {
    schemaVersion: 2,
    factorSetId: 'rekakarbon-2026-v1',
    scope1: 402.0,
    scope2: 0,
    scope3: 0,
    entries: [
      {
        id: 'entry-sc3-solar',
        scope: 1,
        activityType: 'stationary_combustion',
        calculationMethod: 'fuel_consumption',
        sourceCode: 'diesel',
        sourceLabel: 'Minyak Solar Genset Kebun CPO',
        quantity: 150000,
        unit: 'liter',
        factorCode: 'diesel',
        factorSetId: 'rekakarbon-2026-v1',
        emissionFactor: 2.512,
        factorUnit: 'kgCO2e/liter',
        emissionsTCO2e: 402.0,
        metadata: {
          fuelCode: 'solar_diesel',
          fuelLabel: 'Minyak Solar',
        },
      },
    ],
  },
  expectedVerdict: 'REJECT_ANOMALY',
  expectedIsAnomaly: true,
};

export const SCENARIO_4_CEMENT_PROCESS_OMISSION: ReportAuditTestScenario = {
  id: 'SCENARIO_4_CEMENT_PROCESS_OMISSION',
  name: 'Emisi Proses Klinker Semen Tidak Dilaporkan',
  description:
    'Pabrik semen membakar 30.000 ton batu bara tanpa melaporkan emisi reaksi kalsinasi dekarbonasi klinker.',
  sector: 'semen',
  year: 2026,
  totalEmissions: 7200.0,
  calculationData: {
    schemaVersion: 2,
    factorSetId: 'rekakarbon-2026-v1',
    scope1: 7200.0,
    scope2: 0,
    scope3: 0,
    entries: [
      {
        id: 'entry-sc4-coal',
        scope: 1,
        activityType: 'stationary_combustion',
        calculationMethod: 'fuel_consumption',
        sourceCode: 'coal',
        sourceLabel: 'Batu Bara Bituminus Kiln',
        quantity: 3000000,
        unit: 'kg',
        factorCode: 'coal',
        factorSetId: 'rekakarbon-2026-v1',
        emissionFactor: 2.531,
        factorUnit: 'kgCO2e/kg',
        emissionsTCO2e: 7593.0,
        metadata: {
          fuelCode: 'batu_bara',
          fuelLabel: 'Batu Bara Bituminus',
        },
      },
    ],
  },
  expectedVerdict: 'REJECT_ANOMALY',
  expectedIsAnomaly: true,
  expectedFlags: ['EMISI_PROSES_TIDAK_DILAPORKAN'],
};

export const ALL_REPORT_AUDIT_SCENARIOS: ReportAuditTestScenario[] = [
  SCENARIO_1_COMPLIANT_MANUFACTURING,
  SCENARIO_2_STOICHIOMETRIC_UNDERREPORTING,
  SCENARIO_3_FISCAL_PRICE_ANOMALY,
  SCENARIO_4_CEMENT_PROCESS_OMISSION,
];
