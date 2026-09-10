import {
  Injectable,
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { BlockchainOperationStatus, Prisma } from '@prisma/client';
import { BlockchainOperationService } from './blockchain-operation.service';
import { BlockchainService } from './blockchain.service';
import { blockchainConfig } from './config/blockchain.config';
import type { BlockchainTransactionStatus } from './types';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_RECONCILIATION_INTERVAL_MS = 30_000;
const DEFAULT_RECONCILIATION_BATCH_SIZE = 20;
const MAX_RECONCILIATION_BATCH_SIZE = 100;

export interface BlockchainReconciliationSummary {
  scanned: number;
  confirmed: number;
  failed: number;
  pending: number;
  mismatched: number;
  errors: number;
}

@Injectable()
export class BlockchainOperationReconciliationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    BlockchainOperationReconciliationService.name,
  );
  private workerTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly operationService: BlockchainOperationService,
    @Inject(blockchainConfig.KEY)
    private readonly config: ConfigType<typeof blockchainConfig>,
  ) {}

  onModuleInit(): void {
    if (!this.config.reconciliationWorkerEnabled) {
      this.logger.log('Blockchain receipt reconciliation worker is disabled.');
      return;
    }

    const intervalMs =
      this.config.reconciliationIntervalMs > 0
        ? this.config.reconciliationIntervalMs
        : DEFAULT_RECONCILIATION_INTERVAL_MS;
    this.workerTimer = setInterval(() => {
      void this.reconcileSubmittedOperations();
    }, intervalMs);
    this.workerTimer.unref();
    void this.reconcileSubmittedOperations();
  }

  onModuleDestroy(): void {
    if (this.workerTimer) {
      clearInterval(this.workerTimer);
      this.workerTimer = null;
    }
  }

  async reconcileSubmittedOperations(
    requestedLimit?: number,
  ): Promise<BlockchainReconciliationSummary> {
    const summary: BlockchainReconciliationSummary = {
      scanned: 0,
      confirmed: 0,
      failed: 0,
      pending: 0,
      mismatched: 0,
      errors: 0,
    };

    if (this.isRunning) return summary;
    this.isRunning = true;

    try {
      const operations = await this.prisma.blockchainOperation.findMany({
        where: {
          status: BlockchainOperationStatus.SUBMITTED,
          transactionHash: { not: null },
        },
        orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
        take: this.normalizeLimit(requestedLimit),
      });

      for (const operation of operations) {
        summary.scanned += 1;
        if (!operation.transactionHash) continue;

        try {
          const transactionStatus =
            await this.blockchainService.getTransactionStatus(
              operation.transactionHash,
            );

          if (transactionStatus.status === 'pending') {
            summary.pending += 1;
            continue;
          }

          if (!this.matchesOperation(operation, transactionStatus)) {
            await this.operationService.markFailed(
              operation.idempotencyKey,
              new Error(
                'Blockchain receipt does not match the operation chain or contract.',
              ),
              'reconciliation',
            );
            summary.mismatched += 1;
            continue;
          }

          if (transactionStatus.status === 'confirmed') {
            await this.operationService.markConfirmed(
              operation.idempotencyKey,
              {
                txHash: transactionStatus.txHash,
                blockNumber: transactionStatus.blockNumber,
                chainId: transactionStatus.chainId,
                contractAddress: transactionStatus.contractAddress,
              },
            );
            summary.confirmed += 1;
            continue;
          }

          await this.operationService.markFailed(
            operation.idempotencyKey,
            new Error('Blockchain transaction was mined but reverted.'),
            'permanent',
          );
          summary.failed += 1;
        } catch (error: unknown) {
          summary.errors += 1;
          this.logger.error(
            `Failed to reconcile blockchain operation ${operation.idempotencyKey}.`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    } catch (error: unknown) {
      summary.errors += 1;
      this.logger.error(
        'Failed to load submitted blockchain operations for reconciliation.',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isRunning = false;
    }

    return summary;
  }

  private matchesOperation(
    operation: Prisma.BlockchainOperationGetPayload<object>,
    transactionStatus: BlockchainTransactionStatus,
  ): boolean {
    if (
      operation.chainId !== null &&
      operation.chainId !== transactionStatus.chainId
    ) {
      return false;
    }

    if (!operation.contractAddress) return true;
    if (!transactionStatus.contractAddress) return false;

    return (
      operation.contractAddress.toLowerCase() ===
      transactionStatus.contractAddress.toLowerCase()
    );
  }

  private normalizeLimit(requestedLimit?: number): number {
    const defaultLimit =
      this.config.reconciliationBatchSize > 0
        ? this.config.reconciliationBatchSize
        : DEFAULT_RECONCILIATION_BATCH_SIZE;
    const limit = requestedLimit ?? defaultLimit;
    if (!Number.isSafeInteger(limit) || limit <= 0) return defaultLimit;
    return Math.min(limit, MAX_RECONCILIATION_BATCH_SIZE);
  }
}
