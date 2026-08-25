import * as ort from 'onnxruntime-node';
import {
  AuditEmissionReportDto,
  IndustrialSector,
} from './dto/audit-emission-report.dto';

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

export const STOICHIOMETRIC_FACTORS = {
  solarDieselTco2ePerLiter: 0.00268,
  coalTco2ePerKg: 0.00242,
  naturalGasTco2ePerM3: 0.0019,
  gridElectricityTco2ePerKwh: 0.00085,
  cementClinkerCalcinationTco2ePerTon: 0.525,
  biomassNetTco2ePerTon: 0.02,
};

export const MARKET_PRICE_RANGES = {
  solarDiesel: { min: 16000.0, max: 25000.0, nominal: 20500.0 },
  coal: { min: 850.0, max: 1600.0, nominal: 1200.0 },
  naturalGas: { min: 7500.0, max: 13500.0, nominal: 10000.0 },
  gridElectricity: { min: 1350.0, max: 1900.0, nominal: 1600.0 },
};

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
   * Transforms raw emission report data into the exact 15-dimensional Float32 tensor for ONNX inference.
   */
  public static extractFeatures(
    report: AuditEmissionReportDto,
  ): ExtractedFeatures {
    const sector = report.sector;
    const sectorIdx = SECTOR_TO_IDX[sector] ?? 1;
    const bench =
      SECTOR_BENCHMARKS[sector] ||
      SECTOR_BENCHMARKS[IndustrialSector.MANUFAKTUR];

    const prod = Math.max(report.productionTonnes, 0.0001);
    const reported = Math.max(report.reportedEmissionsTco2e, 0.0);
    const hist = Math.max(report.historicalEmissionsTco2e ?? reported, 0.0001);

    const statFuel = Math.max(report.statFuelLiters ?? 0.0, 0.0);
    const mobFuel = Math.max(report.mobFuelLiters ?? 0.0, 0.0);
    const biomass = Math.max(report.biomassTonnes ?? 0.0, 0.0);
    const clinker = Math.max(report.clinkerTonnes ?? 0.0, 0.0);
    const cSolar = Math.max(report.costSolarIdr ?? 0.0, 0.0);
    const cCoal = Math.max(report.costCoalIdr ?? 0.0, 0.0);
    const cGas = Math.max(report.costGasIdr ?? 0.0, 0.0);
    const cPln = Math.max(report.costPlnIdr ?? 0.0, 0.0);

    const eps = 1e-6;

    // 1. Stoichiometric Physics: Direct Combustion + IPPU Process Emissions
    const eDiesel =
      (statFuel + mobFuel) * STOICHIOMETRIC_FACTORS.solarDieselTco2ePerLiter;
    const eCoal =
      (cCoal / MARKET_PRICE_RANGES.coal.nominal) *
      STOICHIOMETRIC_FACTORS.coalTco2ePerKg;
    const eGas =
      (cGas / MARKET_PRICE_RANGES.naturalGas.nominal) *
      STOICHIOMETRIC_FACTORS.naturalGasTco2ePerM3;
    const ePln =
      (cPln / MARKET_PRICE_RANGES.gridElectricity.nominal) *
      STOICHIOMETRIC_FACTORS.gridElectricityTco2ePerKwh;
    const eBiomass = biomass * STOICHIOMETRIC_FACTORS.biomassNetTco2ePerTon;
    const eProcess =
      clinker * STOICHIOMETRIC_FACTORS.cementClinkerCalcinationTco2ePerTon;

    const eExpected = Math.max(
      eDiesel + eCoal + eGas + ePln + eBiomass + eProcess,
      prod * 0.05,
    );

    // Derived Feature 1: Stoichiometric Divergence Ratio
    const divergence = Math.abs(eExpected - reported) / (eExpected + eps);
    const divergencePct = Math.round(divergence * 100.0 * 10) / 10;

    // Derived Feature 2: Solar Fuel Unit Cost Log (IDR / L)
    const unitSolar = statFuel > 0 ? cSolar / (statFuel + eps) : 20500.0;
    const clampedSolarCost = Math.max(0, Math.min(unitSolar, 1e7));
    const solarUnitCostLog = Math.log1p(clampedSolarCost);

    // Derived Feature 3: Raw Emission Intensity (tCO2e / Ton Product)
    const intensity = reported / prod;

    // Derived Feature 4: Sector-Normalized Intensity Z-Score
    const intensityZ =
      (intensity - bench.avgIntensityTco2ePerTon) / (bench.stdIntensity + eps);

    // Derived Feature 5: YoY Growth Ratio
    const yoyChange = (reported - hist) / hist;

    // Derived Feature 6: Energy Spend per Ton Product
    const totalCost = cSolar + cCoal + cGas + cPln;
    const costPerTon = totalCost / prod;

    // Derived Feature 7: Reported Emissions to Energy Spend Ratio
    const spendRatio = reported / (totalCost * 1e-9 + eps);

    // Derived Feature 8: Process Emission to Total Expected Ratio
    const processRatio = eProcess / (eExpected + eps);

    // Derived Feature 9: Solar Market Price Residual Ratio
    const nominalSolar = MARKET_PRICE_RANGES.solarDiesel.nominal;
    const solarPriceResidual =
      Math.abs(unitSolar - nominalSolar) / nominalSolar;

    // Derived Features 10-15: One-Hot Sector Encoding (6 dimensions)
    const sectorOneHot = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
    if (sectorIdx >= 0 && sectorIdx < 6) {
      sectorOneHot[sectorIdx] = 1.0;
    }

    const featuresArray = new Float32Array([
      divergence,
      solarUnitCostLog,
      intensity,
      intensityZ,
      yoyChange,
      costPerTon,
      spendRatio,
      processRatio,
      solarPriceResidual,
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

    const tensor = new ort.Tensor('float32', nativeData, [1, 15]);

    return {
      eExpected,
      divergencePct,
      unitSolar,
      intensity,
      intensityZ: Math.abs(intensityZ),
      featuresArray,
      tensor,
    };
  }
}
