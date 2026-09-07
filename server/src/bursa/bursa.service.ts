import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ComplianceRating, EmissionReportStatus, Prisma } from '@prisma/client';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PtbaeService } from '../compliance/ptbae.service';
import type {
  BursaItem,
  BursaListingCandidate,
  BursaPurchaseEligibility,
  BursaPurchaseResult,
  BursaRevenueAllocationView,
  BursaWorkflowListing,
} from './types';
import type { BlockchainBursaListingResult } from '../blockchain/types';
import type {
  ConfirmListingDto,
  CreateListingDto,
  UpdateMarketPriceDto,
} from './dto';

type BursaListingWithDetails = Prisma.BursaListingGetPayload<{
  include: {
    carbonToken: { include: { project: true } };
    project: true;
    kthGroup: true;
  };
}>;

@Injectable()
export class BursaService {
  private readonly logger = new Logger(BursaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly ptbaeService: PtbaeService,
  ) {}

  private toWorkflowListing(
    listing: BursaListingWithDetails,
  ): BursaWorkflowListing {
    const project = listing.project ?? listing.carbonToken.project;
    return {
      id: listing.id,
      blockchainListingId: listing.blockchainListingId?.toString() ?? null,
      projectId: listing.projectId,
      kthGroupId: listing.kthGroupId,
      projectName: listing.projectName,
      province: project.province,
      ecosystemType: project.ecosystemType,
      kthGroupName: listing.kthGroup?.groupName ?? null,
      speCertificateNumber: listing.carbonToken.speCertificateNumber,
      vintageYear: listing.vintageYear ?? listing.carbonToken.vintageYear,
      initialVolumeTco2e: Number(listing.initialVolumeTco2e),
      verifiedSaleableVolumeTco2e: Number(listing.verifiedSaleableVolumeTco2e),
      volumeLockedTco2e: Number(listing.volumeLockedTco2e),
      volumeAvailableTco2e: Number(listing.volumeAvailableTco2e),
      volumeSoldTco2e: Number(listing.volumeSoldTco2e),
      eligibleProjectCostIdr: Number(listing.eligibleProjectCostIdr),
      floorPricePerTonIdr: Number(listing.floorPricePerTonIdr),
      currentPricePerTonIdr: Number(listing.currentPricePerTonIdr),
      projectSnapshotMerkleRoot: listing.projectSnapshotMerkleRoot,
      kthConfirmationStatus: listing.kthConfirmationStatus,
      status: listing.status,
      draftTxHash: listing.draftTxHash,
      kthRecipientTxHash: listing.kthRecipientTxHash,
      kthConfirmationTxHash: listing.kthConfirmationTxHash,
      activationTxHash: listing.activationTxHash,
      cancellationTxHash: listing.cancellationTxHash,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };
  }

  private toBursaItem(listing: BursaListingWithDetails): BursaItem {
    const project = listing.project ?? listing.carbonToken.project;
    const volumeAvailable = Number(listing.volumeAvailableTco2e);
    const initialVolume = Number(listing.initialVolumeTco2e);
    const ecosystem = project.ecosystemType.toLowerCase();
    const category: BursaItem['category'] = ecosystem.includes('mangrove')
      ? 'mangrove'
      : ecosystem.includes('peatland')
        ? 'gambut'
        : 'hutan';
    const categoryLabel =
      category === 'mangrove'
        ? 'Kredit Karbon Mangrove'
        : category === 'gambut'
          ? 'Kredit Karbon Gambut'
          : 'Kredit Karbon Hutan Hujan';

    return {
      id: listing.id,
      blockchainListingId: listing.blockchainListingId?.toString() ?? null,
      projectId: listing.projectId,
      kthGroupId: listing.kthGroupId,
      name: listing.projectName,
      verified: listing.kthConfirmationStatus === 'CONFIRMED',
      category,
      categoryLabel,
      location: project.province,
      pricePerTonIDR: Number(listing.currentPricePerTonIdr),
      floorPricePerTonIDR: Number(listing.floorPricePerTonIdr),
      change24h: 0,
      volumeAvailableTCO2e: volumeAvailable,
      volumeSoldTCO2e: Number(listing.volumeSoldTco2e),
      supplyPercent:
        initialVolume > 0
          ? Math.min(100, Math.round((volumeAvailable / initialVolume) * 100))
          : 0,
      vintageYear: listing.vintageYear ?? listing.carbonToken.vintageYear,
      speCertificateNumber: listing.carbonToken.speCertificateNumber,
      projectSnapshotMerkleRoot: listing.projectSnapshotMerkleRoot,
      priceUpdatedAt: listing.updatedAt.toISOString(),
    };
  }

  async getBursaItems(): Promise<BursaItem[]> {
    const listings = await this.prisma.bursaListing.findMany({
      where: {
        status: { in: ['ACTIVE', 'PARTIALLY_FILLED'] },
        blockchainListingId: { not: null },
        kthConfirmationStatus: 'CONFIRMED',
      },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const chainStates = await Promise.all(
      listings.map((listing) =>
        listing.blockchainListingId === null
          ? Promise.resolve(null)
          : this.blockchainService.getBursaListingState(
              Number(listing.blockchainListingId),
            ),
      ),
    );

    return listings
      .map((listing, index) => ({ listing, chainState: chainStates[index] }))
      .filter(
        ({ chainState }) =>
          chainState !== null &&
          (chainState.status === 1 || chainState.status === 2) &&
          chainState.soldAmount < chainState.totalAmount,
      )
      .map(({ listing }) => this.toBursaItem(listing));
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
      (total, order) =>
        total +
        Math.max(
          0,
          Number(order.volumeTco2e) - Number(order.retiredVolumeTco2e),
        ),
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

  async getRegulatorListings(
    regulatorUserId: string,
    includeAll: boolean,
  ): Promise<BursaWorkflowListing[]> {
    const listings = await this.prisma.bursaListing.findMany({
      where: includeAll ? undefined : { sellerUserId: regulatorUserId },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return listings.map((listing) => this.toWorkflowListing(listing));
  }

  async getListingCandidates(
    regulatorUserId: string,
  ): Promise<BursaListingCandidate[]> {
    const regulator = await this.prisma.user.findUnique({
      where: { id: regulatorUserId },
      select: { walletAddress: true },
    });
    if (!regulator?.walletAddress) {
      throw new BadRequestException('Regulator wallet not found');
    }

    const tokens = await this.prisma.carbonToken.findMany({
      where: {
        availableBalanceTco2e: { gt: 0 },
        blockchainTokenId: { not: null },
        mintTxHash: { not: null },
        mintedAt: { not: null },
        project: {
          kthGroupId: { not: null },
          budgetTotalIdr: { gt: 0 },
        },
        listings: {
          none: {
            status: {
              in: [
                'AWAITING_KTH_CONFIRMATION',
                'ACTIVATING',
                'ACTIVE',
                'PARTIALLY_FILLED',
                'FROZEN',
              ],
            },
          },
        },
      },
      include: { project: { include: { kthGroup: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.flatMap((token): BursaListingCandidate[] => {
      const project = token.project;
      const kthGroup = project.kthGroup;
      if (!kthGroup || Number(token.availableBalanceTco2e) <= 0) return [];
      return [
        {
          carbonTokenId: token.id,
          speCertificateNumber: token.speCertificateNumber,
          projectId: project.id,
          projectName: project.projectName,
          province: project.province,
          kthGroupId: kthGroup.id,
          kthGroupName: kthGroup.groupName,
          vintageYear: token.vintageYear,
          availableVolumeTco2e: Number(token.availableBalanceTco2e),
          eligibleProjectCostIdr: Number(project.budgetTotalIdr),
        },
      ];
    });
  }

  async getKthPendingListings(
    kthUserId: string,
  ): Promise<BursaWorkflowListing[]> {
    const kthUser = await this.prisma.user.findUnique({
      where: { id: kthUserId },
      select: { walletAddress: true },
    });
    if (!kthUser?.walletAddress) {
      throw new BadRequestException('KTH wallet not found');
    }

    const listings = await this.prisma.bursaListing.findMany({
      where: {
        status: { in: ['AWAITING_KTH_CONFIRMATION', 'ACTIVATING'] },
        kthGroup: { walletAddress: kthUser.walletAddress },
      },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return listings.map((listing) => this.toWorkflowListing(listing));
  }

  async createListing(
    regulatorUserId: string,
    dto: CreateListingDto,
  ): Promise<BursaWorkflowListing> {
    const regulator = await this.prisma.user.findUnique({
      where: { id: regulatorUserId },
      select: { id: true, walletAddress: true },
    });
    if (!regulator?.walletAddress) {
      throw new BadRequestException('Regulator wallet not found');
    }

    const token = await this.prisma.carbonToken.findUnique({
      where: { id: dto.carbonTokenId },
      include: { project: { include: { kthGroup: true } } },
    });
    if (!token) throw new NotFoundException('Carbon token not found');
    if (!token.blockchainTokenId || !token.mintTxHash || !token.mintedAt) {
      throw new BadRequestException(
        'Only blockchain-minted and verified SPE-GRK can be listed',
      );
    }
    if (!token.project.kthGroupId || !token.project.kthGroup) {
      throw new BadRequestException(
        'Carbon project must have an assigned KTH group',
      );
    }
    if (!token.project.kthGroup.walletAddress) {
      throw new BadRequestException(
        'Assigned KTH group wallet is not configured',
      );
    }

    const saleableVolume = Math.floor(Number(token.availableBalanceTco2e));
    const projectCostIdr = Number(token.project.budgetTotalIdr);
    if (saleableVolume <= 0 || projectCostIdr <= 0) {
      throw new BadRequestException(
        'Verified saleable volume and eligible project cost must be greater than zero',
      );
    }

    const existingListing = await this.prisma.bursaListing.findFirst({
      where: {
        carbonTokenId: token.id,
        status: {
          in: [
            'AWAITING_KTH_CONFIRMATION',
            'ACTIVATING',
            'ACTIVE',
            'PARTIALLY_FILLED',
            'FROZEN',
          ],
        },
      },
      select: { id: true },
    });
    if (existingListing) {
      throw new BadRequestException(
        'This carbon token already has an open listing',
      );
    }

    const floorPricePerTonIdr = Math.ceil(projectCostIdr / saleableVolume);
    const snapshotMerkleRoot = this.createProjectSnapshotMerkleRoot(
      token.project.id,
      token.project.updatedAt,
      token.id,
      token.availableBalanceTco2e,
      token.project.actualSequestrationTco2e,
    );

    const draft = await this.prisma.bursaListing.create({
      data: {
        sellerUserId: regulator.id,
        carbonTokenId: token.id,
        projectId: token.project.id,
        kthGroupId: token.project.kthGroup.id,
        projectName: token.project.projectName,
        vintageYear: token.vintageYear,
        initialVolumeTco2e: saleableVolume,
        verifiedSaleableVolumeTco2e: saleableVolume,
        volumeLockedTco2e: 0,
        volumeAvailableTco2e: saleableVolume,
        volumeSoldTco2e: 0,
        eligibleProjectCostIdr: projectCostIdr,
        floorPricePerTonIdr,
        currentPricePerTonIdr: floorPricePerTonIdr,
        pricePerTonIdr: floorPricePerTonIdr,
        projectSnapshotMerkleRoot: snapshotMerkleRoot,
        status: 'DRAFT',
      },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });

    let chainListing: BlockchainBursaListingResult | null = null;
    try {
      chainListing = await this.blockchainService.createBursaListing(
        regulator.walletAddress,
        Number(token.blockchainTokenId),
        saleableVolume,
        floorPricePerTonIdr,
        token.project.id,
        token.project.kthGroup.id,
        snapshotMerkleRoot,
      );
      const kthRecipientTxHash =
        await this.blockchainService.setBursaListingKthRecipient(
          chainListing.listingId,
          token.project.kthGroup.walletAddress,
        );
      const updated = await this.prisma.bursaListing.update({
        where: { id: draft.id },
        data: {
          blockchainListingId: BigInt(chainListing.listingId),
          draftTxHash: chainListing.txHash,
          kthRecipientTxHash,
          volumeLockedTco2e: saleableVolume,
          status: 'AWAITING_KTH_CONFIRMATION',
        },
        include: {
          carbonToken: { include: { project: true } },
          project: true,
          kthGroup: true,
        },
      });
      await this.prisma.bursaPriceSnapshot.create({
        data: {
          listingId: updated.id,
          floorPricePerTonIdr: updated.floorPricePerTonIdr,
          marketPricePerTonIdr: updated.currentPricePerTonIdr,
          volumeAvailableTco2e: updated.volumeAvailableTco2e,
          volumeSoldTco2e: updated.volumeSoldTco2e,
          formulaVersion: updated.pricingFormulaVersion,
          oracleMerkleRoot: updated.projectSnapshotMerkleRoot,
          txHash: chainListing.txHash,
        },
      });
      return this.toWorkflowListing(updated);
    } catch (error: unknown) {
      if (chainListing) {
        try {
          await this.blockchainService.cancelBursaListing(
            chainListing.listingId,
          );
        } catch (cancelError: unknown) {
          this.logger.error(
            'Unable to cancel incomplete Bursa escrow after listing setup failed',
            cancelError,
          );
        }
      }
      await this.prisma.bursaListing.update({
        where: { id: draft.id },
        data: { status: 'BLOCKCHAIN_FAILED' },
      });
      throw error;
    }
  }

  async confirmKthListing(
    kthUserId: string,
    listingId: string,
    dto: ConfirmListingDto,
  ): Promise<BursaWorkflowListing> {
    const kthUser = await this.prisma.user.findUnique({
      where: { id: kthUserId },
      select: { id: true, walletAddress: true },
    });
    if (!kthUser?.walletAddress)
      throw new BadRequestException('KTH wallet not found');

    const listing = await this.prisma.bursaListing.findUnique({
      where: { id: listingId },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });
    if (!listing) throw new NotFoundException('Bursa listing not found');
    if (
      !listing.kthGroup ||
      listing.kthGroup.walletAddress?.toLowerCase() !==
        kthUser.walletAddress.toLowerCase()
    ) {
      throw new BadRequestException(
        'This listing is not assigned to the authenticated KTH',
      );
    }
    if (!listing.blockchainListingId) {
      throw new BadRequestException('Listing has no blockchain escrow record');
    }
    if (
      listing.status !== 'AWAITING_KTH_CONFIRMATION' &&
      listing.status !== 'ACTIVATING'
    ) {
      throw new BadRequestException('Listing is not awaiting KTH confirmation');
    }

    if (listing.status === 'AWAITING_KTH_CONFIRMATION') {
      const confirmationTxHash =
        await this.blockchainService.confirmBursaListing(
          Number(listing.blockchainListingId),
          kthUser.walletAddress,
        );
      await this.prisma.$transaction(async (tx) => {
        await tx.bursaListing.update({
          where: { id: listing.id },
          data: {
            kthConfirmationStatus: 'CONFIRMED',
            kthConfirmationTxHash: confirmationTxHash,
            status: 'ACTIVATING',
          },
        });
        await tx.bursaListingAttestation.create({
          data: {
            listingId: listing.id,
            kthGroupId: listing.kthGroupId,
            actorUserId: kthUser.id,
            snapshotMerkleRoot: listing.projectSnapshotMerkleRoot ?? '',
            decision: 'CONFIRMED',
            notes: dto.notes,
            txHash: confirmationTxHash,
          },
        });
      });
    }

    const activationTxHash = await this.blockchainService.activateBursaListing(
      Number(listing.blockchainListingId),
    );
    const updated = await this.prisma.bursaListing.update({
      where: { id: listing.id },
      data: {
        status: 'ACTIVE',
        kthConfirmationStatus: 'CONFIRMED',
        kthConfirmedAt: new Date(),
        activationTxHash,
      },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });
    return this.toWorkflowListing(updated);
  }

  async cancelListing(
    regulatorUserId: string,
    listingId: string,
  ): Promise<BursaWorkflowListing> {
    const listing = await this.prisma.bursaListing.findFirst({
      where: { id: listingId, sellerUserId: regulatorUserId },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });
    if (!listing) throw new NotFoundException('Bursa listing not found');
    if (!listing.blockchainListingId)
      throw new BadRequestException('Listing has no blockchain escrow record');
    if (Number(listing.volumeSoldTco2e) > 0) {
      throw new BadRequestException('Listing cannot be cancelled after a sale');
    }
    const cancellationTxHash = await this.blockchainService.cancelBursaListing(
      Number(listing.blockchainListingId),
    );
    const updated = await this.prisma.bursaListing.update({
      where: { id: listing.id },
      data: {
        status: 'CANCELLED',
        cancellationTxHash,
        volumeAvailableTco2e: 0,
        volumeLockedTco2e: 0,
      },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });
    return this.toWorkflowListing(updated);
  }

  async updateMarketPrice(
    regulatorUserId: string,
    listingId: string,
    dto: UpdateMarketPriceDto,
  ): Promise<BursaWorkflowListing> {
    const listing = await this.prisma.bursaListing.findFirst({
      where: { id: listingId, sellerUserId: regulatorUserId },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });
    if (!listing) throw new NotFoundException('Bursa listing not found');
    if (listing.status !== 'ACTIVE' && listing.status !== 'PARTIALLY_FILLED') {
      throw new BadRequestException(
        'Only active listings can update market price',
      );
    }
    if (dto.marketPricePerTonIDR < Number(listing.floorPricePerTonIdr)) {
      throw new BadRequestException(
        'Market price cannot be below the system floor price',
      );
    }
    if (!listing.blockchainListingId) {
      throw new BadRequestException('Listing is not active on blockchain');
    }
    const txHash = await this.blockchainService.updateBursaMarketPrice(
      Number(listing.blockchainListingId),
      dto.marketPricePerTonIDR,
    );
    const updated = await this.prisma.bursaListing.update({
      where: { id: listing.id },
      data: {
        currentPricePerTonIdr: dto.marketPricePerTonIDR,
        pricePerTonIdr: dto.marketPricePerTonIDR,
      },
      include: {
        carbonToken: { include: { project: true } },
        project: true,
        kthGroup: true,
      },
    });
    await this.prisma.bursaPriceSnapshot.create({
      data: {
        listingId: listing.id,
        floorPricePerTonIdr: updated.floorPricePerTonIdr,
        marketPricePerTonIdr: updated.currentPricePerTonIdr,
        volumeAvailableTco2e: updated.volumeAvailableTco2e,
        volumeSoldTco2e: updated.volumeSoldTco2e,
        formulaVersion: updated.pricingFormulaVersion,
        oracleMerkleRoot: updated.projectSnapshotMerkleRoot,
        txHash,
      },
    });
    return this.toWorkflowListing(updated);
  }

  async buyCarbonToken(
    buyerUserId: string,
    listingId: string,
    volumeTco2e: number,
  ): Promise<BursaPurchaseResult> {
    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerUserId },
      include: { companies: true },
    });
    if (!buyer || !buyer.walletAddress) {
      throw new BadRequestException('Buyer wallet not found');
    }
    if (!Number.isFinite(volumeTco2e) || volumeTco2e <= 0) {
      throw new BadRequestException(
        'Purchase volume must be greater than zero',
      );
    }

    const eligibility = await this.getPurchaseEligibility(buyerUserId);
    if (!eligibility.canPurchase || eligibility.purchaseRequirementTCO2e <= 0) {
      throw new BadRequestException(eligibility.message);
    }

    // ERC-1155 SPE-GRK is currently denominated in whole tCO2e units. Round
    // up so a fractional deficit is fully covered rather than under-offset.
    const settlementVolume = Math.ceil(volumeTco2e);
    if (settlementVolume > Math.ceil(eligibility.purchaseRequirementTCO2e)) {
      throw new BadRequestException(
        `Purchase volume exceeds the required offset volume of ${eligibility.purchaseRequirementTCO2e} tCO2e`,
      );
    }

    const listing = await this.prisma.bursaListing.findUnique({
      where: { id: listingId },
      include: { seller: true, carbonToken: true, kthGroup: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== 'ACTIVE' && listing.status !== 'PARTIALLY_FILLED') {
      throw new BadRequestException('Listing is no longer active');
    }
    if (!listing.blockchainListingId) {
      throw new BadRequestException('Listing is not active on blockchain');
    }
    const chainListing = await this.blockchainService.getBursaListingState(
      Number(listing.blockchainListingId),
    );
    if (chainListing.status !== 1 && chainListing.status !== 2) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'BURSA_CHAIN_STATE_MISMATCH',
          message:
            'Listing Bursa sudah tidak aktif di blockchain. Muat ulang daftar listing.',
          details: {
            listingId,
            blockchainListingId: listing.blockchainListingId.toString(),
            chainStatus: chainListing.status,
            chainSoldAmount: chainListing.soldAmount,
            chainTotalAmount: chainListing.totalAmount,
          },
        },
      });
    }
    const chainAvailable = chainListing.totalAmount - chainListing.soldAmount;
    if (chainAvailable < settlementVolume) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'BURSA_CHAIN_VOLUME_MISMATCH',
          message:
            'Volume listing di blockchain lebih kecil dari data yang ditampilkan. Muat ulang daftar listing.',
          details: {
            listingId,
            requestedVolume: settlementVolume,
            chainAvailableVolume: chainAvailable,
            databaseAvailableVolume: Number(listing.volumeAvailableTco2e),
          },
        },
      });
    }
    if (!listing.kthGroup?.walletAddress) {
      throw new BadRequestException(
        'Listing KTH recipient wallet is not configured',
      );
    }
    if (Number(listing.volumeAvailableTco2e) < settlementVolume) {
      throw new BadRequestException('Not enough volume available');
    }

    const quote = await this.blockchainService.quoteBursaPurchase(
      Number(listing.blockchainListingId),
      settlementVolume,
    );
    const buyerBalanceRkb = await this.blockchainService.getWalletBalance(
      buyer.walletAddress,
    );
    if (buyerBalanceRkb < quote.totalCostRkb) {
      const maxAffordableVolume = Math.floor(
        buyerBalanceRkb / quote.unitPricePerTonIdr,
      );
      throw new ConflictException({
        success: false,
        error: {
          code: 'BURSA_INSUFFICIENT_RKB_BALANCE',
          message:
            'Saldo RKB tidak mencukupi untuk volume pembelian ini. Kurangi volume atau lakukan top-up terlebih dahulu.',
          details: {
            requestedVolume: settlementVolume,
            requiredBalanceRkb: quote.totalCostRkb,
            availableBalanceRkb: buyerBalanceRkb,
            unitPricePerTonRkb: quote.unitPricePerTonIdr,
            maxAffordableVolume,
          },
        },
      });
    }
    this.logger.log(
      `Executing Bursa settlement: ${buyer.walletAddress} buys ${settlementVolume} tCO2e from listing ${listing.id}`,
    );
    const txHash = await this.blockchainService.purchaseBursaListing(
      Number(listing.blockchainListingId),
      buyer.walletAddress,
      settlementVolume,
      quote.totalCostRkb,
    );
    const recipients = await this.blockchainService.getBursaRevenueRecipients();
    const allocations = this.calculateAllocations(quote.totalCostRkb, {
      ...recipients,
      restoration: listing.kthGroup.walletAddress,
      maintenance: listing.kthGroup.walletAddress,
    });

    const newVolume = Number(listing.volumeAvailableTco2e) - settlementVolume;
    const newStatus = newVolume <= 0 ? 'FILLED' : 'PARTIALLY_FILLED';
    const remainingDeficit = Math.max(
      0,
      (eligibility.complianceDeficitTCO2e ?? 0) - settlementVolume,
    );
    const remainingOffsetCostIdr = new Prisma.Decimal(
      String(remainingDeficit),
    ).mul(quote.unitPricePerTonIdr);

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.bursaOrder.create({
        data: {
          listingId: listing.id,
          buyerUserId,
          volumeTco2e: settlementVolume,
          pricePerTonIdr: quote.unitPricePerTonIdr,
          totalAmountIdr: quote.totalCostRkb,
          txHash,
          status: 'COMPLETED',
          completedAt: new Date(),
          allocations: {
            create: allocations.map((allocation) => ({
              category: allocation.category,
              recipientWalletAddress: allocation.recipientWalletAddress,
              basisPoints: allocation.basisPoints,
              amountIdr: allocation.amountIdr,
              status: 'CONFIRMED',
              txHash,
            })),
          },
        },
        include: { allocations: true },
      });

      await tx.bursaListing.update({
        where: { id: listing.id },
        data: {
          volumeAvailableTco2e: newVolume,
          volumeSoldTco2e: { increment: settlementVolume },
          status: newStatus,
        },
      });

      await tx.carbonToken.update({
        where: { id: listing.carbonTokenId },
        data: { availableBalanceTco2e: { decrement: settlementVolume } },
      });

      const company = buyer.companies[0];
      if (company) {
        await tx.company.update({
          where: { id: company.id },
          data: {
            carbonDeficitTco2e: remainingDeficit,
            offsetCostIdr: remainingOffsetCostIdr,
            complianceRating:
              remainingDeficit > 0
                ? ComplianceRating.WARNING
                : ComplianceRating.COMPLIANT,
          },
        });
      }

      return createdOrder;
    });

    return {
      id: order.id,
      txHash,
      listingId: order.listingId,
      volumeTco2e: Number(order.volumeTco2e),
      pricePerTonIdr: Number(order.pricePerTonIdr),
      totalAmountIdr: Number(order.totalAmountIdr),
      allocations: order.allocations.map(
        (allocation): BursaRevenueAllocationView => ({
          category: allocation.category,
          recipientWalletAddress: allocation.recipientWalletAddress,
          basisPoints: allocation.basisPoints,
          amountIdr: Number(allocation.amountIdr),
          status: allocation.status,
          txHash: allocation.txHash,
        }),
      ),
    };
  }

  private createProjectSnapshotMerkleRoot(
    projectId: string,
    projectUpdatedAt: Date,
    carbonTokenId: string,
    saleableVolume: unknown,
    actualSequestration: unknown,
  ): string {
    const canonical = [
      projectId,
      projectUpdatedAt.toISOString(),
      carbonTokenId,
      String(saleableVolume),
      String(actualSequestration),
    ].join('|');
    return ethers.keccak256(ethers.toUtf8Bytes(canonical));
  }

  private calculateAllocations(
    totalAmountIdr: number,
    recipients: {
      platform: string;
      restoration: string;
      maintenance: string;
      monitoring: string;
      buffer: string;
      environmentalIntelligence: string;
    },
  ): Array<{
    category: string;
    recipientWalletAddress: string;
    basisPoints: number;
    amountIdr: number;
  }> {
    const amounts = [
      {
        category: 'PLATFORM_FEE',
        recipientWalletAddress: recipients.platform,
        basisPoints: 300,
      },
      {
        category: 'RESTORATION',
        recipientWalletAddress: recipients.restoration,
        basisPoints: 6014,
      },
      {
        category: 'MAINTENANCE',
        recipientWalletAddress: recipients.maintenance,
        basisPoints: 1455,
      },
      {
        category: 'MONITORING_MRV',
        recipientWalletAddress: recipients.monitoring,
        basisPoints: 970,
      },
      {
        category: 'BUFFER_RISK',
        recipientWalletAddress: recipients.buffer,
        basisPoints: 776,
      },
      {
        category: 'ENVIRONMENTAL_INTELLIGENCE',
        recipientWalletAddress: recipients.environmentalIntelligence,
        basisPoints: 485,
      },
    ];
    const allocations = amounts.map((allocation) => ({
      ...allocation,
      amountIdr: Math.floor((totalAmountIdr * allocation.basisPoints) / 10000),
    }));
    const allocated = allocations.reduce(
      (total, allocation) => total + allocation.amountIdr,
      0,
    );
    allocations[1].amountIdr += totalAmountIdr - allocated;
    return allocations;
  }
}
