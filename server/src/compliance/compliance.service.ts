import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PtbaeService } from './ptbae.service';
import type { ComplianceData } from './types';

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ptbaeService: PtbaeService,
  ) {}

  async getComplianceData(
    userId: string,
    requestedYear?: number,
  ): Promise<ComplianceData> {
    const company = await this.prisma.company.findFirst({
      where: { userId },
      orderBy: { actualEmissionTco2e: 'desc' },
      include: {
        emissionReports: {
          orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
          select: { year: true, totalEmissionsTco2e: true },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(
        'No company compliance or emission data available in database',
      );
    }

    const reportForYear = requestedYear
      ? company.emissionReports.find((report) => report.year === requestedYear)
      : company.emissionReports[0];
    const complianceYear =
      requestedYear ?? reportForYear?.year ?? new Date().getFullYear();
    const actual = reportForYear
      ? Number(reportForYear.totalEmissionsTco2e)
      : Number(company.actualEmissionTco2e);
    const quota = await this.ptbaeService.resolveForCompany(
      company.id,
      complianceYear,
    );
    const deficit = this.ptbaeService.calculateDeficit(
      actual,
      quota.quotaTCO2e,
    );
    const cost = deficit === null ? null : deficit * 650000;
    const emissionVsQuotaPercent =
      quota.quotaTCO2e === null
        ? null
        : Math.round((actual / quota.quotaTCO2e) * 100 * 10) / 10;

    return {
      complianceYear,
      emissionVsQuotaPercent,
      emissionIntensity: 0.92,
      emissionIntensityStandard: 0.85,
      carbonDeficit: deficit,
      actualEmissions: actual,
      quotaPTBAE: quota.quotaTCO2e,
      quotaPTBAEStatus: quota.status,
      quotaPTBAESourceDocument: quota.sourceDocument,
      governedBy: 'Permen LHK No. 21/2022 & UU HPP 7/2021',
      administrativeSanction:
        deficit !== null && deficit > 0
          ? 'Peringatan Tertulis & Pembekuan Kuota Tambahan'
          : deficit === null
            ? 'Belum dapat dinilai tanpa PTBAE-PU'
            : 'Nihil',
      djpReportStatus:
        deficit !== null && deficit > 0
          ? 'Menunggu Pelunasan STP'
          : deficit === null
            ? 'Menunggu PTBAE-PU'
            : 'Sinkron Terverifikasi',
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
