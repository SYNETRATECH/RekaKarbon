import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  Prisma,
  PtbaeBlockchainAnchorStatus,
  PtbaeBlockchainAnchorType,
} from '@prisma/client';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';

const ANCHOR_TYPE_TO_CHAIN_VALUE: Record<PtbaeBlockchainAnchorType, number> = {
  [PtbaeBlockchainAnchorType.APPLICATION_SUBMISSION]: 0,
  [PtbaeBlockchainAnchorType.AUDIT_DECISION]: 1,
  [PtbaeBlockchainAnchorType.MINISTRY_DECISION]: 2,
  [PtbaeBlockchainAnchorType.REVOCATION]: 3,
};

const WORKER_INTERVAL_MS = 30_000;
const MAX_ANCHORS_PER_RUN = 10;

type AnchorRecord = Prisma.PtbaeBlockchainAnchorGetPayload<{
  include: { application: true; applicationVersion: true };
}>;

@Injectable()
export class PtbaeAnchorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PtbaeAnchorService.name);
  private workerTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {}

  onModuleInit(): void {
    if (process.env.PTBAE_ANCHOR_WORKER_ENABLED === 'false') return;

    this.workerTimer = setInterval(() => {
      void this.processPendingAnchors();
    }, WORKER_INTERVAL_MS);
    this.workerTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.workerTimer) clearInterval(this.workerTimer);
  }

  async processPendingAnchors(
    limit = MAX_ANCHORS_PER_RUN,
  ): Promise<AnchorRecord[]> {
    const pendingAnchors = await this.prisma.ptbaeBlockchainAnchor.findMany({
      where: {
        status: {
          in: [
            PtbaeBlockchainAnchorStatus.PENDING,
            PtbaeBlockchainAnchorStatus.FAILED,
          ],
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      include: { application: true, applicationVersion: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    const confirmed: AnchorRecord[] = [];
    for (const anchor of pendingAnchors) {
      const result = await this.processAnchor(anchor.id);
      if (result) confirmed.push(result);
    }
    return confirmed;
  }

  private async processAnchor(anchorId: string): Promise<AnchorRecord | null> {
    const claimed = await this.prisma.ptbaeBlockchainAnchor.updateMany({
      where: {
        id: anchorId,
        status: {
          in: [
            PtbaeBlockchainAnchorStatus.PENDING,
            PtbaeBlockchainAnchorStatus.FAILED,
          ],
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      data: {
        status: PtbaeBlockchainAnchorStatus.PROCESSING,
        retryCount: { increment: 1 },
        submittedAt: new Date(),
        lastError: null,
        nextRetryAt: null,
      },
    });

    if (claimed.count === 0) return null;

    const anchor = await this.prisma.ptbaeBlockchainAnchor.findUnique({
      where: { id: anchorId },
      include: { application: true, applicationVersion: true },
    });
    if (!anchor) return null;

    try {
      const blockchainResult =
        await this.blockchainService.anchorPtbaeApplication(
          anchor.applicationId,
          anchor.applicationVersionId ? anchor.applicationVersion.version : 0,
          anchor.merkleRoot,
          ANCHOR_TYPE_TO_CHAIN_VALUE[anchor.anchorType],
        );

      const confirmedAt = new Date();
      const confirmed = await this.prisma.$transaction(async (transaction) => {
        const updatedAnchor = await transaction.ptbaeBlockchainAnchor.update({
          where: { id: anchor.id },
          data: {
            status: PtbaeBlockchainAnchorStatus.CONFIRMED,
            transactionHash: blockchainResult.txHash,
            blockNumber:
              blockchainResult.blockNumber === null
                ? null
                : BigInt(blockchainResult.blockNumber),
            contractAddress: blockchainResult.contractAddress,
            chainId: blockchainResult.chainId,
            confirmedAt,
            lastError: null,
            nextRetryAt: null,
          },
          include: { application: true, applicationVersion: true },
        });

        await transaction.ptbaeApplication.updateMany({
          where: {
            id: anchor.applicationId,
            latestMerkleRoot: anchor.merkleRoot,
          },
          data: {
            latestAnchorStatus: PtbaeBlockchainAnchorStatus.CONFIRMED,
            latestAnchoredAt: confirmedAt,
          },
        });

        return updatedAnchor;
      });

      return confirmed;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown blockchain anchoring error';
      const retryDelayMs = this.getRetryDelayMs(anchor.retryCount);

      await this.prisma.ptbaeBlockchainAnchor.update({
        where: { id: anchor.id },
        data: {
          status: PtbaeBlockchainAnchorStatus.FAILED,
          lastError: message.slice(0, 2000),
          nextRetryAt: new Date(Date.now() + retryDelayMs),
        },
      });

      this.logger.warn(
        `PTBAE anchor ${anchor.id} failed; retry scheduled in ${Math.round(retryDelayMs / 1000)} seconds. ${message}`,
      );
      return null;
    }
  }

  private getRetryDelayMs(retryCount: number): number {
    const exponentialDelay = 15_000 * 2 ** Math.max(0, retryCount - 1);
    return Math.min(exponentialDelay, 15 * 60_000);
  }
}
