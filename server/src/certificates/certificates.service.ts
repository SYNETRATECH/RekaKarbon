import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import type { PurchasedCertificate } from './types';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {}

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

  async retireCarbonToken(
    userId: string,
    tokenId: string,
    volumeTco2e: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.walletAddress)
      throw new BadRequestException('User wallet not found');

    const token = await this.prisma.carbonToken.findUnique({
      where: { id: tokenId },
    });

    if (!token || token.blockchainTokenId == null) {
      throw new NotFoundException('Token not found on blockchain');
    }

    const assetId = Number(token.blockchainTokenId);

    // Check balance on-chain
    const balance = await this.blockchainService.getCarbonBalance(
      user.walletAddress,
      assetId,
    );
    if (balance < volumeTco2e) {
      throw new BadRequestException(
        `Not enough token balance on chain. Wallet has ${balance}, trying to retire ${volumeTco2e}`,
      );
    }

    const certNumber = `SPE-RET-${Date.now()}`;

    this.logger.log(
      `Retiring ${volumeTco2e} tCO2e of assetId ${assetId} for user ${user.walletAddress}`,
    );

    const txHash = await this.blockchainService.retireCarbonToken(
      user.walletAddress,
      assetId,
      volumeTco2e,
      certNumber,
    );

    return {
      txHash,
      certificateNumber: certNumber,
      volumeRetired: volumeTco2e,
      assetId,
    };
  }
}
