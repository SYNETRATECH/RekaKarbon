import { EmissionFeatureEngineer } from '../../src/audit/ml-feature-engineer';
import {
  IndustrialSector,
  AuditEmissionReportDto,
} from '../../src/audit/dto/audit-emission-report.dto';
import fixture from './fixtures/ml-feature-parity.fixture.json';

type MlFeatureParityFixture = {
  version: number;
  feature_names: string[];
  reports: Array<{
    name: string;
    sector_enum: string;
    python_sector: string;
    report: Record<string, number>;
    expected_features: number[];
  }>;
};

// Golden fixture generated from the Python EmissionFeatureEngineer
// (ml/src/rekakarbon_ml/training/transformers.py). See fixture metadata for provenance.
const FIXTURE = fixture as MlFeatureParityFixture;

function withinTolerance(actual: number, expected: number): boolean {
  const rel = Math.abs(expected) * 1e-3;
  const abs = 1e-3;
  return Math.abs(actual - expected) <= Math.max(rel, abs);
}

function assertFeatureMatch(
  actual: number,
  expected: number,
  featureName: string,
): void {
  if (!withinTolerance(actual, expected)) {
    throw new Error(
      `feature ${featureName}: expected ${expected}, got ${actual} (diff ${Math.abs(actual - expected)})`,
    );
  }
}

describe('ML Feature Engineering Contract Parity (Python vs TypeScript)', () => {
  it('fixture is non-empty and exposes the 20-dimension contract', () => {
    expect(FIXTURE.reports.length).toBeGreaterThan(0);
    expect(FIXTURE.feature_names).toHaveLength(20);
  });

  it.each(FIXTURE.reports.map((r) => [r.name, r] as const))(
    'matches the Python EmissionFeatureEngineer output for %s',
    (_name, golden) => {
      const sectorKey = golden.sector_enum as keyof typeof IndustrialSector;
      const dto: AuditEmissionReportDto = {
        sector: IndustrialSector[sectorKey],
        productionTonnes: golden.report.productionTonnes,
        reportedEmissionsTco2e: golden.report.reportedEmissionsTco2e,
        historicalEmissionsTco2e: golden.report.historicalEmissionsTco2e,
        statFuelLiters: golden.report.statFuelLiters,
        mobFuelLiters: golden.report.mobFuelLiters,
        biomassTonnes: golden.report.biomassTonnes,
        clinkerTonnes: golden.report.clinkerTonnes,
        costSolarIdr: golden.report.costSolarIdr,
        costCoalIdr: golden.report.costCoalIdr,
        costGasIdr: golden.report.costGasIdr,
        costPlnIdr: golden.report.costPlnIdr,
      };

      const extracted = EmissionFeatureEngineer.extractFeatures(dto);

      expect(extracted.featuresArray).toHaveLength(20);
      expect(extracted.tensor.dims).toEqual([1, 20]);
      expect(extracted.tensor.data).toHaveLength(20);

      for (let i = 0; i < FIXTURE.feature_names.length; i++) {
        assertFeatureMatch(
          extracted.featuresArray[i],
          golden.expected_features[i],
          FIXTURE.feature_names[i],
        );
      }
    },
  );

  it('produces deterministic output for repeated calls', () => {
    const golden = FIXTURE.reports[0];
    const sectorKey = golden.sector_enum as keyof typeof IndustrialSector;
    const dto: AuditEmissionReportDto = {
      sector: IndustrialSector[sectorKey],
      productionTonnes: golden.report.productionTonnes,
      reportedEmissionsTco2e: golden.report.reportedEmissionsTco2e,
      historicalEmissionsTco2e: golden.report.historicalEmissionsTco2e,
      statFuelLiters: golden.report.statFuelLiters,
      mobFuelLiters: golden.report.mobFuelLiters,
      biomassTonnes: golden.report.biomassTonnes,
      clinkerTonnes: golden.report.clinkerTonnes,
      costSolarIdr: golden.report.costSolarIdr,
      costCoalIdr: golden.report.costCoalIdr,
      costGasIdr: golden.report.costGasIdr,
      costPlnIdr: golden.report.costPlnIdr,
    };

    const first = EmissionFeatureEngineer.extractFeatures(dto).featuresArray;
    const second = EmissionFeatureEngineer.extractFeatures(dto).featuresArray;
    expect(Array.from(first)).toEqual(Array.from(second));
  });
});
