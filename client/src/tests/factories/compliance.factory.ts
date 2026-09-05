import type { ComplianceDataType } from '../../schemas';

export function createMockComplianceData(
  overrides?: Partial<ComplianceDataType>
): ComplianceDataType {
  const actual = overrides?.actualEmissions ?? 17330;
  const quota = overrides?.quotaPTBAE ?? 15000;
  const deficit = Math.max(0, actual - quota);
  const price = overrides?.carbonPricePerTon ?? 30000;

  return {
    complianceYear: overrides?.complianceYear ?? 2026,
    emissionVsQuotaPercent:
      overrides?.emissionVsQuotaPercent ?? Number(((actual / quota) * 100).toFixed(1)),
    emissionIntensity: overrides?.emissionIntensity ?? 0.85,
    emissionIntensityStandard: overrides?.emissionIntensityStandard ?? 0.75,
    carbonDeficit: overrides?.carbonDeficit ?? deficit,
    actualEmissions: actual,
    quotaPTBAE: quota,
    quotaPTBAEStatus: overrides?.quotaPTBAEStatus ?? 'VERIFIED',
    quotaPTBAESourceDocument: overrides?.quotaPTBAESourceDocument ?? 'SK-MENLHK-2025-091',
    governedBy: overrides?.governedBy ?? 'Permen LHK No. 21/2022',
    administrativeSanction: overrides?.administrativeSanction ?? 'Teguran Tertulis Tahap 1',
    djpReportStatus: overrides?.djpReportStatus ?? 'TERVERIFIKASI',
    annualProductionVolume: overrides?.annualProductionVolume ?? 500000,
    carbonPricePerTon: price,
    totalEstimatedCostIDR: overrides?.totalEstimatedCostIDR ?? deficit * price,
    annualHistory: overrides?.annualHistory ?? [
      { year: '2023', historis: 16000 },
      { year: '2024', historis: 16800 },
      { year: '2025', historis: 17100 },
      { year: '2026', historis: actual, proyeksi: quota },
    ],
    ...overrides,
  };
}
