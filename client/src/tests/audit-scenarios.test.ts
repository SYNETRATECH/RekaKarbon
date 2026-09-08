import { describe, it, expect } from 'vitest';
import { MockReportRepository } from '../repositories/report.mock.repository';
import { CalculatorReportSubmissionSchema } from '../schemas';
import type { CalculationData } from '../types';

describe('Emission Report ML Anomaly Detection & XAI Scenarios', () => {
  const repository = new MockReportRepository();

  describe('Scenario 1: Compliant Manufacturing Report', () => {
    const calcData: CalculationData = {
      schemaVersion: 2,
      factorSetId: 'rekakarbon-2026-v1',
      scope1: 125.6,
      scope2: 156.8,
      scope3: 0,
      entries: [
        {
          id: 'sc1-solar',
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
          metadata: { fuelCode: 'solar_diesel' },
        },
        {
          id: 'sc1-pln',
          scope: 2,
          activityType: 'purchased_electricity',
          calculationMethod: 'location_based',
          sourceCode: 'pln_jamali',
          sourceLabel: 'Listrik Grid PLN',
          quantity: 200000,
          unit: 'kwh',
          factorCode: 'grid_pln',
          factorSetId: 'rekakarbon-2026-v1',
          emissionFactor: 0.784,
          factorUnit: 'kgCO2e/kWh',
          emissionsTCO2e: 156.8,
          metadata: {},
        },
      ],
    };

    it('should return PASS_VERIFIED with trust score >= 80 and valid Zod schema compliance', async () => {
      const submission = await repository.submitCalculatorReport(
        2026,
        'manufaktur',
        282.4,
        calcData
      );

      // 1. Zod Contract Schema Validation
      const parseResult = CalculatorReportSubmissionSchema.safeParse(submission);
      expect(parseResult.success).toBe(true);

      // 2. Behavioral Assertions
      const audit = submission.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(false);
      expect(audit?.verdict).toBe('PASS_VERIFIED');
      expect(audit?.trustScore).toBeGreaterThanOrEqual(80.0);
      expect(audit?.flags).toEqual([]);

      // 3. Explainable AI (SHAP) Diagnostics
      expect(audit?.xai).toBeDefined();
      expect(audit?.xai?.shapAttributions?.length).toBeGreaterThan(0);
      const fuelShap = audit?.xai?.shapAttributions?.find(
        (s) => s.featureName === 'scope1_stoichiometric_divergence'
      );
      expect(fuelShap).toBeDefined();
      expect(fuelShap?.shapValue).toBeLessThanOrEqual(0); // Negative SHAP = strengthens compliance
      expect(fuelShap?.impact).toBe('DECREASES_ANOMALY');
    });
  });

  describe('Scenario 2: Stoichiometric Under-reporting Mismatch', () => {
    const fraudCalcData: CalculationData = {
      schemaVersion: 2,
      factorSetId: 'rekakarbon-2026-v1',
      scope1: 150.0,
      scope2: 0,
      scope3: 0,
      entries: [
        {
          id: 'sc2-solar-underreported',
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
          metadata: { fuelCode: 'solar_diesel' },
        },
      ],
    };

    it('should flag under-reporting with REJECT_ANOMALY and stoichiometric divergence flags', async () => {
      const submission = await repository.submitCalculatorReport(
        2026,
        'manufaktur',
        150.0,
        fraudCalcData
      );

      const parseResult = CalculatorReportSubmissionSchema.safeParse(submission);
      expect(parseResult.success).toBe(true);

      const audit = submission.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(true);
      expect(audit?.verdict).toBe('REJECT_ANOMALY');
      expect(audit?.trustScore).toBeLessThan(60.0);
      expect(audit?.flags).toContain('UNDER_REPORTING_TERINDIKASI');
      expect(audit?.flags).toContain('DEVIASI_FISIK_DAN_LAPORAN_TINGGI');

      // Positive SHAP indicates risk contributor
      const fuelShap = audit?.xai?.shapAttributions?.find(
        (s) => s.featureName === 'scope1_stoichiometric_divergence'
      );
      expect(fuelShap).toBeDefined();
      expect(fuelShap?.shapValue).toBeGreaterThan(0);
      expect(fuelShap?.impact).toBe('INCREASES_ANOMALY');
    });
  });

  describe('Scenario 3: Fiscal Solar Price Outlier', () => {
    const abnormalPriceCalcData: CalculationData = {
      schemaVersion: 2,
      factorSetId: 'rekakarbon-2026-v1',
      scope1: 402.0,
      scope2: 0,
      scope3: 0,
      entries: [
        {
          id: 'sc3-solar',
          scope: 1,
          activityType: 'stationary_combustion',
          calculationMethod: 'fuel_consumption',
          sourceCode: 'diesel',
          sourceLabel: 'Solar Genset Sawit',
          quantity: 150000,
          unit: 'liter',
          factorCode: 'diesel',
          factorSetId: 'rekakarbon-2026-v1',
          emissionFactor: 2.512,
          factorUnit: 'kgCO2e/liter',
          emissionsTCO2e: 402.0,
          metadata: { fuelCode: 'solar_diesel' },
        },
      ],
    };

    it('should flag abnormal solar price outside DJP corridor with BIAYA_SOLAR_TIDAK_REALISTIS', async () => {
      const submission = await repository.submitCalculatorReport(
        2026,
        'cpo',
        402.0,
        abnormalPriceCalcData
      );

      const parseResult = CalculatorReportSubmissionSchema.safeParse(submission);
      expect(parseResult.success).toBe(true);

      const audit = submission.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(true);
      expect(audit?.scoreDjp).toBeLessThan(70.0);
      expect(audit?.flags).toContain('BIAYA_SOLAR_TIDAK_REALISTIS');
    });
  });

  describe('Scenario 4: Cement Clinker Process Omission', () => {
    const cementCoalCalcData: CalculationData = {
      schemaVersion: 2,
      factorSetId: 'rekakarbon-2026-v1',
      scope1: 7593.0,
      scope2: 0,
      scope3: 0,
      entries: [
        {
          id: 'sc4-coal',
          scope: 1,
          activityType: 'stationary_combustion',
          calculationMethod: 'fuel_consumption',
          sourceCode: 'coal',
          sourceLabel: 'Batu Bara Kiln Semen',
          quantity: 3000000,
          unit: 'kg',
          factorCode: 'coal',
          factorSetId: 'rekakarbon-2026-v1',
          emissionFactor: 2.531,
          factorUnit: 'kgCO2e/kg',
          emissionsTCO2e: 7593.0,
          metadata: { fuelCode: 'batu_bara' },
        },
      ],
    };

    it('should flag cement plant omitting calcination process emissions with EMISI_PROSES_TIDAK_DILAPORKAN', async () => {
      const submission = await repository.submitCalculatorReport(
        2026,
        'semen',
        7593.0,
        cementCoalCalcData
      );

      const parseResult = CalculatorReportSubmissionSchema.safeParse(submission);
      expect(parseResult.success).toBe(true);

      const audit = submission.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(true);
      expect(audit?.flags).toContain('EMISI_PROSES_TIDAK_DILAPORKAN');
    });
  });
});
