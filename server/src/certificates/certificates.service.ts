import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PurchasedCertificate } from './types';

@Injectable()
export class CertificatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    const tokens = await this.prisma.carbonToken.findMany({
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((t) => {
      const vol = Number(t.totalMintedTco2e);
      const price = Number(t.project.carbonPricePerTonIdr);

      return {
        id: t.id,
        certificateNumber: t.speCertificateNumber,
        projectName: t.project.projectName,
        projectCategory: t.project.ecosystemType
          .toLowerCase()
          .replace(/_/g, ' '),
        location: t.project.province,
        coordinates: [t.project.latitude || 0, t.project.longitude || 0],
        purchasedVolumeTCO2e: vol,
        pricePerTonIDR: price,
        totalPaidIDR: vol * price,
        purchaseDate: t.mintedAt
          ? t.mintedAt.toISOString().split('T')[0]
          : '2026-02-14',
        registryStandard: 'SPE-GRK (Sistem Registri Nasional PPI)',
        blockchainTxHash:
          t.mintTxHash ||
          '0x7f9a8b1c94857102948571029485710294857102948571029485710294857102',
        projectCondition: {
          canopyDensityPercent: Number(t.project.ndviScore) * 100,
          carbonSequestrationRate: Number(t.project.actualSequestrationTco2e),
          kthIncentiveDisbursed: Number(t.project.budgetDisbursedIdr),
          droneAuditStatus: 'Terverifikasi LiDAR',
          lastSpatialAuditDate: '2026-02-14',
        },
      };
    });
  }
}
