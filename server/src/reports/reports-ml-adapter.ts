import {
  AuditEmissionReportDto,
  IndustrialSector,
} from '../audit/dto/audit-emission-report.dto';
import {
  MARKET_PRICE_RANGES,
  SECTOR_BENCHMARKS,
} from '../audit/ml-feature-engineer';
import type { CalculatorCalculationData } from './types';

export class ReportsMlAdapter {
  /**
   * Normalizes raw sector strings from client calculator into the IndustrialSector enum.
   */
  public static mapSectorToIndustrialSector(sector: string): IndustrialSector {
    const raw = sector.toLowerCase().trim();

    if (raw.includes('semen')) return IndustrialSector.SEMEN;
    if (
      raw.includes('manufaktur') ||
      raw.includes('industri') ||
      raw.includes('pabrik')
    ) {
      return IndustrialSector.MANUFAKTUR;
    }
    if (
      raw.includes('sawit') ||
      raw.includes('cpo') ||
      raw.includes('pertanian') ||
      raw.includes('perkebunan')
    ) {
      return IndustrialSector.CPO;
    }
    if (raw.includes('logam') || raw.includes('baja'))
      return IndustrialSector.LOGAM;
    if (raw.includes('pulp') || raw.includes('kertas'))
      return IndustrialSector.PULP;
    if (
      raw.includes('pltu') ||
      raw.includes('listrik') ||
      raw.includes('pertambangan') ||
      raw.includes('energi')
    ) {
      return IndustrialSector.PLTU;
    }

    // Direct match against enum values
    const match = Object.values(IndustrialSector).find(
      (val) => val.toLowerCase() === raw,
    );
    if (match) return match;

    return IndustrialSector.MANUFAKTUR;
  }

  /**
   * Transforms CalculatorCalculationData entries and emission totals into a strongly-typed
   * AuditEmissionReportDto consumed by MlAuditEngineService.
   */
  public static toAuditEmissionReportDto(params: {
    sector: string;
    totalEmissions: number;
    calculationData?: CalculatorCalculationData | null;
    historicalEmissionsTco2e?: number;
    companyProductionCapacity?: number;
  }): AuditEmissionReportDto {
    const industrialSector = this.mapSectorToIndustrialSector(params.sector);
    const bench =
      SECTOR_BENCHMARKS[industrialSector] ||
      SECTOR_BENCHMARKS[IndustrialSector.MANUFAKTUR];

    let statFuelLiters = 0;
    let mobFuelLiters = 0;
    let coalKg = 0;
    let gasM3 = 0;
    let electricityKwh = 0;
    const clinkerTonnes = 0;
    let biomassTonnes = 0;

    const entries = params.calculationData?.entries || [];

    for (const entry of entries) {
      const q =
        typeof entry.quantity === 'number' && Number.isFinite(entry.quantity)
          ? entry.quantity
          : 0;
      if (q <= 0) continue;

      const actType = String(entry.activityType || '');
      const srcCode =
        typeof entry.sourceCode === 'string' ? entry.sourceCode : '';
      const meta = entry.metadata as Record<string, unknown> | undefined;
      const metaFuel = typeof meta?.fuelCode === 'string' ? meta.fuelCode : '';
      const fuelCode = (metaFuel || srcCode).toLowerCase();

      if (actType === 'stationary_combustion') {
        if (fuelCode.includes('diesel') || fuelCode.includes('solar')) {
          statFuelLiters += q;
        } else if (
          fuelCode.includes('coal') ||
          fuelCode.includes('batu_bara')
        ) {
          coalKg += entry.unit === 'ton' ? q * 1000 : q;
        } else if (fuelCode.includes('gas')) {
          gasM3 += q;
        } else if (
          fuelCode.includes('biomass') ||
          fuelCode.includes('cangkang')
        ) {
          biomassTonnes += entry.unit === 'kg' ? q / 1000 : q;
        }
      } else if (actType === 'mobile_combustion') {
        if (
          fuelCode.includes('diesel') ||
          fuelCode.includes('solar') ||
          fuelCode.includes('bensin') ||
          fuelCode.includes('gasoline')
        ) {
          mobFuelLiters += q;
        }
      } else if (actType === 'purchased_electricity') {
        electricityKwh += q;
      }
    }

    // Estimate production volume in tonnes
    // Priority: Company-configured baseline capacity -> Benchmark-derived physical output
    const reportedTotal = Math.max(params.totalEmissions, 0.001);
    let productionTonnes =
      params.companyProductionCapacity && params.companyProductionCapacity > 0
        ? params.companyProductionCapacity
        : reportedTotal / Math.max(bench.avgIntensityTco2ePerTon, 0.05);

    productionTonnes = Math.max(productionTonnes, 0.001);

    // Calculate expenditures based on official market nominal price indices
    const costSolarIdr =
      (statFuelLiters + mobFuelLiters) *
      MARKET_PRICE_RANGES.solarDiesel.nominal;
    const costCoalIdr = coalKg * MARKET_PRICE_RANGES.coal.nominal;
    const costGasIdr = gasM3 * MARKET_PRICE_RANGES.naturalGas.nominal;
    const costPlnIdr =
      electricityKwh * MARKET_PRICE_RANGES.gridElectricity.nominal;

    return {
      sector: industrialSector,
      productionTonnes: Math.round(productionTonnes * 10) / 10,
      reportedEmissionsTco2e: Math.round(reportedTotal * 100) / 100,
      historicalEmissionsTco2e: params.historicalEmissionsTco2e,
      statFuelLiters: Math.round(statFuelLiters * 10) / 10,
      mobFuelLiters: Math.round(mobFuelLiters * 10) / 10,
      biomassTonnes: Math.round(biomassTonnes * 10) / 10,
      clinkerTonnes: Math.round(clinkerTonnes * 10) / 10,
      costSolarIdr: Math.round(costSolarIdr),
      costCoalIdr: Math.round(costCoalIdr),
      costGasIdr: Math.round(costGasIdr),
      costPlnIdr: Math.round(costPlnIdr),
    };
  }
}
