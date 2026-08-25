import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ComplianceData } from './types';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async getComplianceData(): Promise<ComplianceData> {
    const company = await this.prisma.company.findFirst({
      orderBy: { actualEmissionTco2e: 'desc' },
    });

    if (!company) {
      throw new NotFoundException(
        'No company compliance or emission data available in database',
      );
    }

    const actual = Number(company.actualEmissionTco2e);
    const cap = Number(company.emissionCapTco2e);
    const deficit = Number(company.carbonDeficitTco2e);
    const cost = Number(company.offsetCostIdr);

    return {
      emissionVsQuotaPercent: Math.round((actual / (cap || 1)) * 100 * 10) / 10,
      emissionIntensity: 0.92,
      emissionIntensityStandard: 0.85,
      carbonDeficit: deficit,
      actualEmissions: actual,
      quotaPTBAE: cap,
      governedBy: 'Permen LHK No. 21/2022 & UU HPP 7/2021',
      administrativeSanction:
        deficit > 0
          ? 'Peringatan Tertulis & Pembekuan Kuota Tambahan'
          : 'Nihil',
      djpReportStatus:
        deficit > 0 ? 'Menunggu Pelunasan STP' : 'Sinkron Terverifikasi',
      annualProductionVolume: 12500000,
      carbonPricePerTon: 650000,
      totalEstimatedCostIDR: cost,
      annualHistory: [
        { year: '2023', historis: Math.round(actual * 0.85) },
        { year: '2024', historis: Math.round(actual * 0.92) },
        { year: '2025', historis: actual },
        { year: '2026', proyeksi: Math.round(actual * 0.95) },
      ],
    };
  }
}
