import * as ort from 'onnxruntime-node';
import {
  AuditEmissionReportDto,
  IndustrialSector,
} from './dto/audit-emission-report.dto';
import type { FeatureContribution, XaiDiagnostics } from './types/audit.types';

/**
 * The ONNX anomaly pipeline (`ml/models/anomaly_pipeline.onnx`) is trained on the
 * 20-dimensional feature contract produced by the Python `EmissionFeatureEngineer`
 * (`ml/src/rekakarbon_ml/training/transformers.py`). This TypeScript implementation
 * MUST mirror that transform numerically (same constants, ordering and formulas) so the
 * in-process tensor fed to onnxruntime-node matches the training feature space.
 * Parity is enforced by `server/test/contracts/ml-feature-parity.contract.spec.ts`.
 *
 * Stoichiometric factors and market price indices are synced with
 * `ml/src/rekakarbon_ml/data/benchmark_loader.py`.
 */
export const SUPPORTED_SECTORS: IndustrialSector[] = [
  IndustrialSector.SEMEN,
  IndustrialSector.MANUFAKTUR,
  IndustrialSector.CPO,
  IndustrialSector.LOGAM,
  IndustrialSector.PULP,
  IndustrialSector.PLTU,
];

export const SECTOR_TO_IDX: Record<IndustrialSector, number> = {
  [IndustrialSector.SEMEN]: 0,
  [IndustrialSector.MANUFAKTUR]: 1,
  [IndustrialSector.CPO]: 2,
  [IndustrialSector.LOGAM]: 3,
  [IndustrialSector.PULP]: 4,
  [IndustrialSector.PLTU]: 5,
};

/**
 * Maps the server `IndustrialSector` enum onto the canonical ML sector taxonomy
 * (manufaktur, pertambangan, perbankan, konstruksi, pertanian, perhotelan).
 * Mirrors `normalize_sector_key` in `ml/src/rekakarbon_ml/data/benchmark_loader.py`
 * (legacy mappings: semen/logam/pltu/listrik -> pertambangan, cpo/sawit -> pertanian,
 * pulp/kertas -> manufaktur).
 */
export const SECTOR_TO_PYTHON_IDX: Record<IndustrialSector, number> = {
  [IndustrialSector.SEMEN]: 1, // pertambangan
  [IndustrialSector.MANUFAKTUR]: 0, // manufaktur
  [IndustrialSector.CPO]: 4, // pertanian
  [IndustrialSector.LOGAM]: 1, // pertambangan
  [IndustrialSector.PULP]: 0, // manufaktur
  [IndustrialSector.PLTU]: 1, // pertambangan
};

export const STOICHIOMETRIC_FACTORS = {
  solarDieselTco2ePerLiter: 0.002512,
  coalTco2ePerKg: 0.002531,
  naturalGasTco2ePerM3: 0.002023,
  gridElectricityTco2ePerKwh: 0.000207,
  cementClinkerCalcinationTco2ePerTon: 0.525,
  biomassNetTco2ePerTon: 0.02,
};

export const MARKET_PRICE_RANGES = {
  solarDiesel: { min: 16000.0, max: 25000.0, nominal: 20500.0 },
  coal: { min: 850.0, max: 1600.0, nominal: 1200.0 },
  naturalGas: { min: 7500.0, max: 13500.0, nominal: 10000.0 },
  gridElectricity: { min: 1200.0, max: 1900.0, nominal: 1500.0 },
};

/** Sector intensity benchmark priors keyed by CANONICAL ML sector index (0..5). */
export const PYTHON_SECTOR_BENCHMARKS: Array<{
  avgIntensityTco2ePerTon: number;
  stdIntensity: number;
}> = [
  { avgIntensityTco2ePerTon: 0.28, stdIntensity: 0.08 }, // manufaktur
  { avgIntensityTco2ePerTon: 1.25, stdIntensity: 0.25 }, // pertambangan
  { avgIntensityTco2ePerTon: 0.04, stdIntensity: 0.02 }, // perbankan
  { avgIntensityTco2ePerTon: 0.42, stdIntensity: 0.12 }, // konstruksi
  { avgIntensityTco2ePerTon: 0.18, stdIntensity: 0.06 }, // pertanian
  { avgIntensityTco2ePerTon: 0.08, stdIntensity: 0.03 }, // perhotelan
];

export const SECTOR_BENCHMARKS: Record<
  IndustrialSector,
  {
    avgIntensityTco2ePerTon: number;
    minIntensity: number;
    maxIntensity: number;
    stdIntensity: number;
    clinkerRatio: number;
    hasProcessEmissions: boolean;
    processEmissionFactor: number;
  }
> = {
  [IndustrialSector.SEMEN]: {
    avgIntensityTco2ePerTon: 0.65,
    minIntensity: 0.45,
    maxIntensity: 0.95,
    stdIntensity: 0.08,
    clinkerRatio: 0.72,
    hasProcessEmissions: true,
    processEmissionFactor: 0.525,
  },
  [IndustrialSector.MANUFAKTUR]: {
    avgIntensityTco2ePerTon: 0.28,
    minIntensity: 0.1,
    maxIntensity: 0.55,
    stdIntensity: 0.06,
    clinkerRatio: 0.0,
    hasProcessEmissions: false,
    processEmissionFactor: 0.0,
  },
  [IndustrialSector.CPO]: {
    avgIntensityTco2ePerTon: 0.18,
    minIntensity: 0.08,
    maxIntensity: 0.4,
    stdIntensity: 0.04,
    clinkerRatio: 0.0,
    hasProcessEmissions: false,
    processEmissionFactor: 0.0,
  },
  [IndustrialSector.LOGAM]: {
    avgIntensityTco2ePerTon: 1.85,
    minIntensity: 1.2,
    maxIntensity: 2.8,
    stdIntensity: 0.25,
    clinkerRatio: 0.0,
    hasProcessEmissions: true,
    processEmissionFactor: 0.35,
  },
  [IndustrialSector.PULP]: {
    avgIntensityTco2ePerTon: 0.45,
    minIntensity: 0.25,
    maxIntensity: 0.8,
    stdIntensity: 0.07,
    clinkerRatio: 0.0,
    hasProcessEmissions: false,
    processEmissionFactor: 0.0,
  },
  [IndustrialSector.PLTU]: {
    avgIntensityTco2ePerTon: 0.92,
    minIntensity: 0.75,
    maxIntensity: 1.25,
    stdIntensity: 0.09,
    clinkerRatio: 0.0,
    hasProcessEmissions: false,
    processEmissionFactor: 0.0,
  },
};

export interface ExtractedFeatures {
  eExpected: number;
  divergencePct: number;
  unitSolar: number;
  intensity: number;
  intensityZ: number;
  featuresArray: Float32Array;
  tensor: ort.Tensor;
}

export class EmissionFeatureEngineer {
  /**
   * Transforms raw emission report data into the exact 20-dimensional Float32 tensor
   * consumed by the ONNX anomaly pipeline, numerically mirroring the Python
   * `EmissionFeatureEngineer` transform.
   */
  public static extractFeatures(
    report: AuditEmissionReportDto,
  ): ExtractedFeatures {
    const sectorIdx =
      SECTOR_TO_PYTHON_IDX[report.sector] ??
      SECTOR_TO_PYTHON_IDX[IndustrialSector.MANUFAKTUR];

    const eps = 1e-6;

    // Raw physical fields (all non-negative)
    const prod = Math.max(report.productionTonnes, 1e-4);
    const s1Rep = Math.max(report.reportedEmissionsTco2e * 0.6, 0.0);
    const s2Rep = Math.max(report.reportedEmissionsTco2e * 0.4, 0.0);
    const s3Rep = 0.0;
    const totRep = Math.max(report.reportedEmissionsTco2e, 0.0);
    const hist = Math.max(report.historicalEmissionsTco2e ?? totRep, 1e-4);

    const statFuel = Math.max(report.statFuelLiters ?? 0.0, 0.0);
    const mobFuel = Math.max(report.mobFuelLiters ?? 0.0, 0.0);
    // Physical volumes are derived from e-Faktur expenditures at nominal market price
    // when the DTO does not carry them directly (matches Python backward compatibility).
    const coalKg = Math.max(
      (report.costCoalIdr ?? 0.0) / MARKET_PRICE_RANGES.coal.nominal,
      0.0,
    );
    const gasM3 = Math.max(
      (report.costGasIdr ?? 0.0) / MARKET_PRICE_RANGES.naturalGas.nominal,
      0.0,
    );
    const elecKwh = Math.max(
      (report.costPlnIdr ?? 0.0) / MARKET_PRICE_RANGES.gridElectricity.nominal,
      0.0,
    );
    const cSolar = Math.max(report.costSolarIdr ?? 0.0, 0.0);
    const cCoal = Math.max(report.costCoalIdr ?? 0.0, 0.0);
    const cGas = Math.max(report.costGasIdr ?? 0.0, 0.0);
    const cPln = Math.max(report.costPlnIdr ?? 0.0, 0.0);
    const clinker = Math.max(report.clinkerTonnes ?? 0.0, 0.0);

    // 1. Scope 1 stoichiometric physics (fuel combustion + process IPPU)
    const eDiesel =
      (statFuel + mobFuel) * STOICHIOMETRIC_FACTORS.solarDieselTco2ePerLiter;
    const eCoal =
      coalKg > 0
        ? coalKg * STOICHIOMETRIC_FACTORS.coalTco2ePerKg
        : (cCoal / MARKET_PRICE_RANGES.coal.nominal) *
          STOICHIOMETRIC_FACTORS.coalTco2ePerKg;
    const eGas =
      gasM3 > 0
        ? gasM3 * STOICHIOMETRIC_FACTORS.naturalGasTco2ePerM3
        : (cGas / MARKET_PRICE_RANGES.naturalGas.nominal) *
          STOICHIOMETRIC_FACTORS.naturalGasTco2ePerM3;
    const eProcess =
      clinker * STOICHIOMETRIC_FACTORS.cementClinkerCalcinationTco2ePerTon;
    const eS1Expected = Math.max(eDiesel + eCoal + eGas + eProcess, 0.001);
    const scope1Divergence =
      Math.abs(eS1Expected - s1Rep) / (eS1Expected + eps);

    // 2. Scope 2 grid electricity stoichiometry
    const eS2Expected = Math.max(
      elecKwh > 0
        ? elecKwh * STOICHIOMETRIC_FACTORS.gridElectricityTco2ePerKwh
        : (cPln / MARKET_PRICE_RANGES.gridElectricity.nominal) *
            STOICHIOMETRIC_FACTORS.gridElectricityTco2ePerKwh,
      0.001,
    );
    const scope2Divergence =
      Math.abs(eS2Expected - s2Rep) / (eS2Expected + eps);

    // 3. Unit costs (log-transformed)
    const solarUnitCost = statFuel > 0 ? cSolar / (statFuel + eps) : 20500.0;
    const solarUnitCostLog = Math.log1p(
      Math.min(Math.max(solarUnitCost, 0.0), 1e7),
    );
    const elecUnitCost = elecKwh > 0 ? cPln / (elecKwh + eps) : 1500.0;
    const elecUnitCostLog = Math.log1p(
      Math.min(Math.max(elecUnitCost, 0.0), 1e7),
    );

    // 4. Emission intensity & canonical sector z-score
    const effectiveTotal = totRep > 0 ? totRep : s1Rep + s2Rep + s3Rep;
    const emissionIntensity = effectiveTotal / prod;
    const pyBench = PYTHON_SECTOR_BENCHMARKS[sectorIdx];
    const sectorIntensityZscore =
      (emissionIntensity - pyBench.avgIntensityTco2ePerTon) /
      (pyBench.stdIntensity + eps);

    // 5. Scope proportions (Scope 3 fully optional => always 0 here)
    const scope1Ratio = s1Rep / (effectiveTotal + eps);
    const scope2Ratio = s2Rep / (effectiveTotal + eps);
    const scope3Ratio = s3Rep / (effectiveTotal + eps);

    // 6. Math summation discrepancy (sum of scopes vs declared total)
    const scopeSum = s1Rep + s2Rep + s3Rep;
    const summationDiscrepancy =
      Math.abs(scopeSum - effectiveTotal) / (effectiveTotal + eps);

    // 7. Price residuals vs nominal market indices
    const solarPriceResidual =
      Math.abs(solarUnitCost - MARKET_PRICE_RANGES.solarDiesel.nominal) /
      MARKET_PRICE_RANGES.solarDiesel.nominal;
    const elecPriceResidual =
      Math.abs(elecUnitCost - MARKET_PRICE_RANGES.gridElectricity.nominal) /
      MARKET_PRICE_RANGES.gridElectricity.nominal;

    // 8. YoY change & energy spend per ton
    const yoyChange = (effectiveTotal - hist) / hist;
    const totalEnergyCost = cSolar + cCoal + cGas + cPln;
    const energySpendPerTon = totalEnergyCost / prod;

    // 9. Sector one-hot encoding (6 canonical dims)
    const sectorOneHot = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    sectorOneHot[sectorIdx] = 1.0;

    const featuresArray = new Float32Array([
      scope1Divergence,
      scope2Divergence,
      solarUnitCostLog,
      elecUnitCostLog,
      emissionIntensity,
      sectorIntensityZscore,
      scope1Ratio,
      scope2Ratio,
      scope3Ratio,
      summationDiscrepancy,
      solarPriceResidual,
      elecPriceResidual,
      yoyChange,
      energySpendPerTon,
      ...sectorOneHot,
    ]);

    // Sanitize any NaNs or Infs
    for (let i = 0; i < featuresArray.length; i++) {
      if (isNaN(featuresArray[i])) featuresArray[i] = 0.0;
      else if (featuresArray[i] === Infinity) featuresArray[i] = 1e5;
      else if (featuresArray[i] === -Infinity) featuresArray[i] = -1e5;
    }

    const buffer = Buffer.alloc(featuresArray.length * 4);
    const nativeData = new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      featuresArray.length,
    );
    for (let i = 0; i < featuresArray.length; i++) {
      nativeData[i] = featuresArray[i];
    }

    const tensor = new ort.Tensor('float32', nativeData, [1, 20]);

    return {
      eExpected: eS1Expected + eS2Expected,
      divergencePct: Math.round(scope1Divergence * 100.0 * 10) / 10,
      unitSolar: solarUnitCost,
      intensity: emissionIntensity,
      intensityZ: Math.abs(sectorIntensityZscore),
      featuresArray,
      tensor,
    };
  }

  /**
   * Computes native in-process Explainable AI (XAI) diagnostics, feature contributions, and recommendations.
   */
  public static computeXaiDiagnostics(
    report: AuditEmissionReportDto,
    extracted: ReturnType<typeof EmissionFeatureEngineer.extractFeatures>,
    scores: { scoreDjp: number; scoreBbm: number; scoreCems: number },
    flags: string[],
  ): XaiDiagnostics {
    const sector = report.sector;
    const bench =
      SECTOR_BENCHMARKS[sector] ||
      SECTOR_BENCHMARKS[IndustrialSector.MANUFAKTUR];

    const reported = Math.max(report.reportedEmissionsTco2e, 0);
    const drivers: FeatureContribution[] = [];

    // Driver 1: Physical Stoichiometric Divergence
    if (extracted.divergencePct > 20.0) {
      const impactScore = Math.min(
        100.0,
        Math.round(extracted.divergencePct * 1.2 * 10) / 10,
      );
      const isUnder = reported < extracted.eExpected;
      drivers.push({
        featureName: 'stoichiometric_divergence',
        label: 'Divergensi Fisik Stoikiometri',
        userValue: `${reported.toLocaleString('id-ID')} tCO2e`,
        benchmarkValue: `${Math.round(extracted.eExpected).toLocaleString('id-ID')} tCO2e`,
        impactScore,
        direction: isUnder ? 'BELOW_NORMAL' : 'ABOVE_NORMAL',
        unit: 'tCO2e',
      });
    }

    // Driver 2: DJP e-Faktur Solar Unit Cost
    const statFuel = report.statFuelLiters ?? 0;
    if (statFuel > 0) {
      const unitSolar = extracted.unitSolar;
      const nominalSolar = MARKET_PRICE_RANGES.solarDiesel.nominal;
      if (
        unitSolar < MARKET_PRICE_RANGES.solarDiesel.min ||
        unitSolar > MARKET_PRICE_RANGES.solarDiesel.max
      ) {
        const impactScore = Math.min(
          100.0,
          Math.round((100.0 - scores.scoreDjp) * 10) / 10,
        );
        drivers.push({
          featureName: 'solar_unit_cost',
          label: 'Biaya Unit Solar DJP e-Faktur',
          userValue: `Rp ${Math.round(unitSolar).toLocaleString('id-ID')}/L`,
          benchmarkValue: `Rp ${nominalSolar.toLocaleString('id-ID')}/L (Rp 16rb-25rb)`,
          impactScore,
          direction: 'MISMATCH',
          unit: 'IDR/L',
        });
      }
    }

    // Driver 3: Sector Intensity Z-Score
    if (extracted.intensityZ > 1.8) {
      const impactScore = Math.min(
        100.0,
        Math.round(extracted.intensityZ * 22.0 * 10) / 10,
      );
      const isLow = extracted.intensity < bench.avgIntensityTco2ePerTon;
      drivers.push({
        featureName: 'sector_intensity_zscore',
        label: `Intensitas Emisi Sektor ${sector}`,
        userValue: `${extracted.intensity.toFixed(3)} tCO2e/ton`,
        benchmarkValue: `${bench.avgIntensityTco2ePerTon.toFixed(3)} tCO2e/ton (min: ${bench.minIntensity})`,
        impactScore,
        direction: isLow ? 'BELOW_NORMAL' : 'ABOVE_NORMAL',
        unit: 'tCO2e/ton',
      });
    }

    // Driver 4: Unreported Process Emissions
    if (flags.includes('EMISI_PROSES_TIDAK_DILAPORKAN')) {
      drivers.push({
        featureName: 'process_emission_ratio',
        label: 'Pos Emisi Proses Dekarbonasi/Peleburan',
        userValue: '0 tCO2e (Tidak Terdata)',
        benchmarkValue: `Faktor Dekarbonasi: ${bench.processEmissionFactor} tCO2e/ton`,
        impactScore: 88.5,
        direction: 'BELOW_NORMAL',
        unit: 'tCO2e',
      });
    }

    // Driver 5: Historical Volatility
    if (flags.includes('VOLATILITAS_HISTORIS_EKSTRIM')) {
      const hist = report.historicalEmissionsTco2e ?? reported;
      drivers.push({
        featureName: 'yoy_change_ratio',
        label: 'Perubahan YoY Historis',
        userValue: `${reported.toLocaleString('id-ID')} tCO2e`,
        benchmarkValue: `${hist.toLocaleString('id-ID')} tCO2e`,
        impactScore: 75.0,
        direction: reported < hist ? 'BELOW_NORMAL' : 'ABOVE_NORMAL',
        unit: 'tCO2e',
      });
    }

    // Sort drivers descending by impactScore
    drivers.sort((a, b) => b.impactScore - a.impactScore);

    // Build Actionable Recommendation Guidance
    let recommendation =
      'Laporan emisi Anda konsisten dan memenuhi standar acuan teknis ESDM & KLHK.';
    if (drivers.length > 0) {
      const top = drivers[0];
      if (top.featureName === 'stoichiometric_divergence') {
        recommendation =
          'Periksa kembali konsumsi BBM dan energi listrik. Angka emisi dilaporkan jauh di bawah batas stoikiometri pembakaran fisik.';
      } else if (top.featureName === 'solar_unit_cost') {
        recommendation =
          'Verifikasi nomor seri DJP e-Faktur dan total belanja Solar HSD. Pembagian harga unit tidak sesuai harga pasar resmi.';
      } else if (top.featureName === 'process_emission_ratio') {
        recommendation =
          'Tambahkan perhitungan emisi proses dekarbonasi batu kapur (clinker) atau reaksi peleburan dalam formulir pelaporan.';
      } else if (top.featureName === 'sector_intensity_zscore') {
        recommendation =
          'Angka intensitas emisi per ton produk berbeda signifikan dari distribusi rata-rata industri sejenis.';
      } else {
        recommendation =
          'Tinjau kembali data masukan pelaporan emisi Anda sebelum pengajuan ulang.';
      }
    }

    const fiscalPriceDeltaPct =
      statFuel > 0
        ? Math.round(
            (Math.abs(
              extracted.unitSolar - MARKET_PRICE_RANGES.solarDiesel.nominal,
            ) /
              MARKET_PRICE_RANGES.solarDiesel.nominal) *
              1000,
          ) / 10
        : 0;

    return {
      topAnomalyDrivers: drivers,
      breakdown: {
        physicalFuelDeltaPct: extracted.divergencePct,
        fiscalPriceDeltaPct,
        sectorIntensityZScore: Math.round(extracted.intensityZ * 100) / 100,
      },
      recommendation,
    };
  }
}
