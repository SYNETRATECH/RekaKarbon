import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { BursaItem } from '../types/bursa';

@Injectable()
export class BursaService {
  constructor(private readonly prisma: PrismaService) {}

  async getBursaItems(): Promise<BursaItem[]> {
    const listings = await this.prisma.bursaListing.findMany({
      where: { status: 'ACTIVE' },
      include: { carbonToken: { include: { project: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l) => {
      const vol = Number(l.volumeAvailableTco2e);
      const price = Number(l.pricePerTonIdr);
      const eco = l.carbonToken.project.ecosystemType.toLowerCase();
      const category: 'mangrove' | 'hutan' | 'gambut' = eco.includes('mangrove')
        ? 'mangrove'
        : eco.includes('peatland')
          ? 'gambut'
          : 'hutan';
      const categoryLabel =
        category === 'mangrove'
          ? 'Kredit Karbon Mangrove'
          : category === 'gambut'
            ? 'Kredit Karbon Gambut'
            : 'Kredit Karbon Hutan Hujan';

      return {
        id: l.id,
        name: l.projectName,
        verified: true,
        category,
        categoryLabel,
        location: l.carbonToken.project.province,
        priceFraction: price,
        change24h: 2.5,
        supplyFractions: vol,
        supplyPercent: Math.min(100, Math.round((vol / 50000) * 100)),
      };
    });
  }
}
