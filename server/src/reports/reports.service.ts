import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { EmissionReport } from '../types/report';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmissionReports(): Promise<EmissionReport[]> {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((c) => {
      const actual = Number(c.actualEmissionTco2e);

      return {
        id: c.id,
        year: 2026,
        title: `Laporan Emisi Tahunan ${c.name} 2026`,
        fileName: `Laporan_Emisi_${c.name.replace(/\s+/g, '_')}_2026.pdf`,
        fileSizeBytes: 2450000,
        uploadDate: c.auditDate ? c.auditDate.toISOString().split('T')[0] : '',
        status: 'verified',
        totalEmissionsTCO2e: actual,
        sectors: [
          {
            id: `sec-${c.id}-1`,
            name: 'Pembakaran Bahan Bakar Langsung (Scope 1)',
            scope: 'Scope 1',
            emissionsTCO2e: Math.round(actual * 0.75),
            percentage: 75,
            description: 'Emisi dari cerobong pembakaran batu bara / gas',
            color: '#10b981',
          },
          {
            id: `sec-${c.id}-2`,
            name: 'Konsumsi Listrik Grid PLN (Scope 2)',
            scope: 'Scope 2',
            emissionsTCO2e: Math.round(actual * 0.18),
            percentage: 18,
            description: 'Emisi tidak langsung dari konsumsi listrik',
            color: '#3b82f6',
          },
          {
            id: `sec-${c.id}-3`,
            name: 'Proses Fugitive & Limbah Operasional',
            scope: 'Scope 1',
            emissionsTCO2e: Math.round(actual * 0.07),
            percentage: 7,
            description: 'Emisi fugitive dari sistem pendingin dan flare',
            color: '#f59e0b',
          },
        ],
      };
    });
  }
}
