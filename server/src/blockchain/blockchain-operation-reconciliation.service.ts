import {
  Injectable,
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  BlockchainOperationStatus,
  Prisma,
  WalletDepositStatus,
  WalletLedgerEntryType,
} from '@prisma/client';
import { BlockchainOperationService } from './blockchain-operation.service';
import { BlockchainService } from './blockchain.service';
import { blockchainConfig } from './config/blockchain.config';
import type { BlockchainTransactionStatus } from './types';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_RECONCILIATION_INTERVAL_MS = 30_000;
const DEFAULT_RECONCILIATION_BATCH_SIZE = 20;
const MAX_RECONCILIATION_BATCH_SIZE = 100;
const SUBMITTED_WITHOUT_HASH_TIMEOUT_MS = 5 * 60_000;

export interface BlockchainReconciliationSummary {
  scanned: number;
  confirmed: number;
  failed: number;
  pending: number;
  mismatched: number;
  reconciliationRequired: number;
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
      reconciliationRequired: 0,
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
      const limit = this.normalizeLimit(requestedLimit);
      const orphanedOperations =
        operations.length < limit
          ? await this.prisma.blockchainOperation.findMany({
              where: {
                status: BlockchainOperationStatus.SUBMITTED,
                transactionHash: null,
                submittedAt: {
                  lt: new Date(Date.now() - SUBMITTED_WITHOUT_HASH_TIMEOUT_MS),
                },
              },
              orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
              take: limit - operations.length,
            })
          : [];

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
            await this.markWalletDepositForReconciliation(
              operation,
              'Blockchain receipt does not match the configured chain or contract.',
            );
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
            await this.finalizeWalletDeposit(operation, transactionStatus);
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

          await this.markWalletDepositFailed(
            operation,
            'Blockchain transaction was mined but reverted.',
          );
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

      for (const operation of orphanedOperations) {
        summary.scanned += 1;
        try {
          await this.markWalletDepositForReconciliation(
            operation,
            'Operasi blockchain sudah submitted lebih dari lima menit tetapi transaction hash belum tersimpan.',
          );
          await this.operationService.markFailed(
            operation.idempotencyKey,
            new Error(
              'Submitted blockchain operation has no transaction hash after timeout.',
            ),
            'reconciliation',
          );
          summary.reconciliationRequired += 1;
        } catch (error: unknown) {
          summary.errors += 1;
          this.logger.error(
            `Failed to quarantine orphaned blockchain operation ${operation.idempotencyKey}.`,
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

  private async finalizeWalletDeposit(
    operation: Prisma.BlockchainOperationGetPayload<object>,
    transactionStatus: BlockchainTransactionStatus,
  ): Promise<void> {
    if (operation.aggregateType !== 'WalletDeposit') return;

    const blockNumber = transactionStatus.blockNumber;
    if (blockNumber === null) {
      throw new Error('Confirmed wallet deposit receipt has no block number.');
    }

    await this.prisma.$transaction(async (transaction) => {
      const deposit = await transaction.walletDeposit.findUnique({
        where: { id: operation.aggregateId },
      });
      if (!deposit) {
        throw new Error(
          `Wallet deposit ${operation.aggregateId} was not found during reconciliation.`,
        );
      }

      if (deposit.status === WalletDepositStatus.SETTLED) {
        if (
          deposit.blockchainTxHash &&
          deposit.blockchainTxHash !== transactionStatus.txHash
        ) {
          throw new Error(
            `Wallet deposit ${deposit.id} is settled with a different transaction hash.`,
          );
        }
        return;
      }

      if (
        deposit.status === WalletDepositStatus.CANCELLED ||
        deposit.status === WalletDepositStatus.FAILED_PERMANENT
      ) {
        await transaction.walletDeposit.update({
          where: { id: deposit.id },
          data: {
            status: WalletDepositStatus.RECONCILIATION_REQUIRED,
            blockchainTxHash: transactionStatus.txHash,
            blockNumber: BigInt(blockNumber),
            lastError:
              'Receipt mint terkonfirmasi setelah deposit ditandai tidak dapat diproses; diperlukan rekonsiliasi manual.',
          },
        });
        return;
      }

      await transaction.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: WalletDepositStatus.SETTLED,
          blockchainTxHash: transactionStatus.txHash,
          blockNumber: BigInt(blockNumber),
          confirmedAt: new Date(),
          lastError: null,
        },
      });

      await transaction.walletLedgerEntry.upsert({
        where: { idempotencyKey: `deposit:${deposit.id}:credit` },
        create: {
          userId: deposit.userId,
          depositId: deposit.id,
          walletAddress: deposit.walletAddress,
          entryType: WalletLedgerEntryType.DEPOSIT_CREDIT,
          amountIdr: deposit.amountIdr,
          tokenAmount: deposit.tokenAmount,
          idempotencyKey: `deposit:${deposit.id}:credit`,
          reference: deposit.externalId,
          description:
            'Top-up Wallet RKB_CREDIT melalui pembayaran terverifikasi',
        },
        update: {},
      });
    });
  }

  private async markWalletDepositForReconciliation(
    operation: Prisma.BlockchainOperationGetPayload<object>,
    reason: string,
  ): Promise<void> {
    if (operation.aggregateType !== 'WalletDeposit') return;

    await this.prisma.walletDeposit.updateMany({
      where: {
        id: operation.aggregateId,
        status: { not: WalletDepositStatus.SETTLED },
      },
      data: {
        status: WalletDepositStatus.RECONCILIATION_REQUIRED,
        lastError: reason,
      },
    });
  }

  private async markWalletDepositFailed(
    operation: Prisma.BlockchainOperationGetPayload<object>,
    reason: string,
  ): Promise<void> {
    if (operation.aggregateType !== 'WalletDeposit') return;

    await this.prisma.walletDeposit.updateMany({
      where: {
        id: operation.aggregateId,
        status: { not: WalletDepositStatus.SETTLED },
      },
      data: {
        status: WalletDepositStatus.FAILED_PERMANENT,
        lastError: reason,
      },
    });
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
