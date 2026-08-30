import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ComplianceRating } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PtbaeService } from '../compliance/ptbae.service';
import type { BursaItem } from './types';

@Injectable()
export class BursaService {
  private readonly logger = new Logger(BursaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly ptbaeService: PtbaeService,
  ) {}

  async getBursaItems(): Promise<BursaItem[]> {
    const listings = await this.prisma.bursaListing.findMany({
      where: {
        status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] },
      },
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
        pricePerTonIDR: price,
        change24h: 2.5,
        volumeAvailableTCO2e: vol,
        supplyPercent: Math.min(100, Math.round((vol / 50000) * 100)),
      };
    });
  }

  async buyCarbonToken(
    buyerUserId: string,
    listingId: string,
    volumeTco2e: number,
  ) {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerUserId },
      include: { companies: true },
    });
    if (!buyer || !buyer.walletAddress)
      throw new BadRequestException('Buyer wallet not found');
    const company = buyer.companies[0];
    let activeDeficitTCO2e: number | null = null;
    if (company) {
      const latestReport = await this.prisma.emissionReport.findFirst({
        where: { companyId: company.id },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
        select: { year: true, totalEmissionsTco2e: true },
      });
      const complianceYear = latestReport?.year ?? new Date().getFullYear();
      const actualEmissionsTCO2e = latestReport
        ? Number(latestReport.totalEmissionsTco2e)
        : Number(company.actualEmissionTco2e);
      const quota = await this.ptbaeService.resolveForCompany(
        company.id,
        complianceYear,
      );
      activeDeficitTCO2e = this.ptbaeService.calculateDeficit(
        actualEmissionsTCO2e,
        quota.quotaTCO2e,
      );
    }
    if (activeDeficitTCO2e !== null && volumeTco2e > activeDeficitTCO2e) {
      throw new BadRequestException(
        `Purchase volume exceeds the active carbon deficit cap of ${activeDeficitTCO2e} tCO2e`,
      );
    }

    const listing = await this.prisma.bursaListing.findUnique({
      where: { id: listingId },
      include: {
        seller: true,
        carbonToken: true,
      },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== 'ACTIVE' && listing.status !== 'PARTIALLY_FILLED') {
      throw new BadRequestException('Listing is no longer active');
    }

    if (Number(listing.volumeAvailableTco2e) < volumeTco2e) {
      throw new BadRequestException('Not enough volume available');
    }

    if (!listing.seller.walletAddress)
      throw new BadRequestException('Seller wallet not found');
    if (listing.carbonToken.blockchainTokenId == null)
      throw new BadRequestException('Asset not minted on blockchain');

    const assetId = Number(listing.carbonToken.blockchainTokenId);
    const totalCostIdr = volumeTco2e * Number(listing.pricePerTonIdr);

    this.logger.log(
      `Executing bursa purchase on-chain: ${buyer.walletAddress} buys ${volumeTco2e} from ${listing.seller.walletAddress}`,
    );

    // 1. Blockchain execution (atomic deduction and transfer)
    const txHash = await this.blockchainService.executeBursaPurchase(
      buyer.walletAddress,
      listing.seller.walletAddress,
      assetId,
      volumeTco2e,
      totalCostIdr,
    );

    // 2. Database updates
    return await this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.bursaOrder.create({
        data: {
          listingId: listing.id,
          buyerUserId: buyerUserId,
          volumeTco2e,
          pricePerTonIdr: listing.pricePerTonIdr,
          totalAmountIdr: totalCostIdr,
          txHash,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update listing volume
      const newVolume = Number(listing.volumeAvailableTco2e) - volumeTco2e;
      const newStatus = newVolume <= 0 ? 'FILLED' : 'PARTIALLY_FILLED';

      await tx.bursaListing.update({
        where: { id: listing.id },
        data: {
          volumeAvailableTco2e: newVolume,
          status: newStatus,
        },
      });

      if (company && activeDeficitTCO2e !== null) {
        const remainingDeficitTCO2e = Math.max(
          0,
          activeDeficitTCO2e - volumeTco2e,
        );
        await tx.company.update({
          where: { id: company.id },
          data: {
            carbonDeficitTco2e: remainingDeficitTCO2e,
            offsetCostIdr: remainingDeficitTCO2e * 650000,
            complianceRating:
              remainingDeficitTCO2e > 0
                ? ComplianceRating.NON_COMPLIANT
                : ComplianceRating.COMPLIANT,
          },
        });
      }

      return order;
    });
  }
}
