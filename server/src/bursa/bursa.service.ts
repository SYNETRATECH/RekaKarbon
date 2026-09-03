import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ComplianceRating, EmissionReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PtbaeService } from '../compliance/ptbae.service';
import type { BursaItem, BursaPurchaseEligibility } from './types';

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

  async getPurchaseEligibility(
    buyerUserId: string,
  ): Promise<BursaPurchaseEligibility> {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerUserId },
      include: { companies: true },
    });
    const company = buyer?.companies[0];

    if (!company) {
      return this.ineligible(
        'company_unavailable',
        'Perusahaan emitter belum tersedia.',
      );
    }
    if (!buyer?.walletAddress) {
      return this.ineligible(
        'wallet_unavailable',
        'Wallet emitter belum tersedia.',
      );
    }

    const latestReport = await this.prisma.emissionReport.findFirst({
      where: { companyId: company.id },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, year: true, status: true },
    });
    const approvedReport = await this.prisma.emissionReport.findFirst({
      where: {
        companyId: company.id,
        status: EmissionReportStatus.APPROVED,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, year: true, totalEmissionsTco2e: true },
    });

    if (!approvedReport) {
      const reason =
        latestReport?.status === EmissionReportStatus.REVISION_REQUIRED
          ? 'report_revision_required'
          : latestReport?.status === EmissionReportStatus.SUBMITTED
            ? 'report_pending_audit'
            : 'report_not_submitted';
      return this.ineligible(
        reason,
        'Bursa hanya tersedia setelah laporan emisi disetujui Auditor.',
        {
          complianceYear: latestReport?.year ?? null,
          reportId: latestReport?.id ?? null,
          reportStatus: latestReport?.status?.toLowerCase() ?? null,
        },
      );
    }

    const quota = await this.ptbaeService.resolveForCompany(
      company.id,
      approvedReport.year,
    );
    if (!quota.isOfficial || quota.quotaTCO2e === null) {
      return this.ineligible(
        'ptbae_unavailable',
        'PTBAE-PU resmi untuk tahun laporan belum tersedia.',
        {
          complianceYear: approvedReport.year,
          reportId: approvedReport.id,
          reportStatus: 'approved',
          approvedEmissionsTCO2e: Number(approvedReport.totalEmissionsTco2e),
        },
      );
    }

    const orders = await this.prisma.bursaOrder.findMany({
      where: {
        buyerUserId,
        status: 'COMPLETED',
        listing: {
          carbonToken: { vintageYear: approvedReport.year },
        },
      },
      select: { volumeTco2e: true, retiredVolumeTco2e: true },
    });
    const availableTokenBalanceTCO2e = orders.reduce(
      (total, order) => total + Number(order.volumeTco2e),
      0,
    );
    const retiredTCO2e = orders.reduce(
      (total, order) => total + Number(order.retiredVolumeTco2e),
      0,
    );
    const approvedEmissionsTCO2e = Number(approvedReport.totalEmissionsTco2e);
    const complianceDeficitTCO2e = Math.max(
      0,
      approvedEmissionsTCO2e - quota.quotaTCO2e - retiredTCO2e,
    );
    const purchaseRequirementTCO2e = Math.max(
      0,
      complianceDeficitTCO2e - availableTokenBalanceTCO2e,
    );

    const base = {
      complianceYear: approvedReport.year,
      reportId: approvedReport.id,
      reportStatus: 'approved',
      approvedEmissionsTCO2e,
      ptbaeQuotaTCO2e: quota.quotaTCO2e,
      retiredTCO2e,
      availableTokenBalanceTCO2e,
      complianceDeficitTCO2e,
      purchaseRequirementTCO2e,
    };

    if (complianceDeficitTCO2e === 0) {
      return {
        canPurchase: false,
        reason: 'no_deficit',
        message: 'Tidak ada defisit emisi yang perlu dilunasi.',
        ...base,
      };
    }

    if (purchaseRequirementTCO2e === 0) {
      return {
        canPurchase: false,
        reason: 'offset_tokens_available',
        message:
          'Token yang tersedia sudah cukup. Lanjutkan ke proses retirement.',
        ...base,
      };
    }

    return {
      canPurchase: true,
      reason: 'eligible',
      message: 'Perusahaan dapat membeli token untuk menutup defisit emisi.',
      ...base,
    };
  }

  private ineligible(
    reason: BursaPurchaseEligibility['reason'],
    message: string,
    overrides: Partial<BursaPurchaseEligibility> = {},
  ): BursaPurchaseEligibility {
    return {
      canPurchase: false,
      reason,
      message,
      complianceYear: null,
      reportId: null,
      reportStatus: null,
      approvedEmissionsTCO2e: null,
      ptbaeQuotaTCO2e: null,
      retiredTCO2e: 0,
      availableTokenBalanceTCO2e: 0,
      complianceDeficitTCO2e: null,
      purchaseRequirementTCO2e: 0,
      ...overrides,
    };
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
    const eligibility = await this.getPurchaseEligibility(buyerUserId);
    if (!eligibility.canPurchase || eligibility.purchaseRequirementTCO2e <= 0) {
      throw new BadRequestException(eligibility.message);
    }
    if (volumeTco2e > eligibility.purchaseRequirementTCO2e) {
      throw new BadRequestException(
        `Purchase volume exceeds the required offset volume of ${eligibility.purchaseRequirementTCO2e} tCO2e`,
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

      if (company && eligibility.complianceDeficitTCO2e !== null) {
        await tx.company.update({
          where: { id: company.id },
          data: {
            carbonDeficitTco2e: eligibility.complianceDeficitTCO2e,
            offsetCostIdr: eligibility.complianceDeficitTCO2e * 650000,
            complianceRating: ComplianceRating.WARNING,
          },
        });
      }

      return order;
    });
  }
}
