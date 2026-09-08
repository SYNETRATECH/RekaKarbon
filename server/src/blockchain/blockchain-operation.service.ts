import { Injectable, Logger } from '@nestjs/common';
import { BlockchainOperationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  BlockchainOperationConfirmation,
  BlockchainOperationFailureKind,
  CreateBlockchainOperationInput,
} from './types';

@Injectable()
export class BlockchainOperationService {
  private readonly logger = new Logger(BlockchainOperationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ensurePendingOperation(
    input: CreateBlockchainOperationInput,
  ): Promise<Prisma.BlockchainOperationGetPayload<object>> {
    return this.prisma.blockchainOperation.upsert({
      where: { idempotencyKey: input.idempotencyKey },
      create: {
        operationType: input.operationType,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        idempotencyKey: input.idempotencyKey,
        chainId: input.chainId,
        contractAddress: input.contractAddress,
        functionName: input.functionName,
        functionSelector: input.functionSelector,
        payloadHash: input.payloadHash,
      },
      update: {},
    });
  }

  async claimForExecution(
    idempotencyKey: string,
  ): Promise<Prisma.BlockchainOperationGetPayload<object> | null> {
    const now = new Date();
    const result = await this.prisma.blockchainOperation.updateMany({
      where: {
        idempotencyKey,
        status: {
          in: [
            BlockchainOperationStatus.PENDING,
            BlockchainOperationStatus.FAILED_RETRYABLE,
          ],
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      data: {
        status: BlockchainOperationStatus.SUBMITTED,
        submittedAt: now,
        lastErrorCode: null,
        lastErrorMessage: null,
        nextRetryAt: null,
      },
    });

    if (result.count === 0) return null;
    return this.prisma.blockchainOperation.findUnique({
      where: { idempotencyKey },
    });
  }

  async markSubmitted(
    idempotencyKey: string,
    confirmation: BlockchainOperationConfirmation,
  ): Promise<Prisma.BlockchainOperationGetPayload<object>> {
    return this.prisma.blockchainOperation.update({
      where: { idempotencyKey },
      data: {
        status: BlockchainOperationStatus.SUBMITTED,
        transactionHash: confirmation.txHash,
        nonce: this.toBigIntOrUndefined(confirmation.nonce),
        blockNumber: this.toBigIntOrUndefined(confirmation.blockNumber),
        chainId: confirmation.chainId,
        contractAddress: confirmation.contractAddress,
        submittedAt: new Date(),
        lastErrorCode: null,
        lastErrorMessage: null,
        nextRetryAt: null,
      },
    });
  }

  async markConfirmed(
    idempotencyKey: string,
    confirmation: BlockchainOperationConfirmation,
  ): Promise<Prisma.BlockchainOperationGetPayload<object>> {
    return this.prisma.blockchainOperation.update({
      where: { idempotencyKey },
      data: this.confirmedData(confirmation),
    });
  }

  async markConfirmedInTransaction(
    transaction: Prisma.TransactionClient,
    idempotencyKey: string,
    confirmation: BlockchainOperationConfirmation,
  ): Promise<Prisma.BlockchainOperationGetPayload<object>> {
    return transaction.blockchainOperation.update({
      where: { idempotencyKey },
      data: this.confirmedData(confirmation),
    });
  }

  async markFailed(
    idempotencyKey: string,
    error: unknown,
    failureKind: BlockchainOperationFailureKind,
    nextRetryAt?: Date,
  ): Promise<Prisma.BlockchainOperationGetPayload<object>> {
    const errorDetails = this.getErrorDetails(error);
    const status = this.toFailureStatus(failureKind);
    const operation = await this.prisma.blockchainOperation.update({
      where: { idempotencyKey },
      data: {
        status,
        retryCount: { increment: 1 },
        lastErrorCode: errorDetails.code,
        lastErrorMessage: errorDetails.message.slice(0, 2000),
        nextRetryAt:
          status === BlockchainOperationStatus.FAILED_RETRYABLE
            ? (nextRetryAt ?? null)
            : null,
      },
    });

    this.logger.warn(
      `Blockchain operation ${idempotencyKey} marked ${status}: ${errorDetails.message}`,
    );
    return operation;
  }

  private confirmedData(
    confirmation: BlockchainOperationConfirmation,
  ): Prisma.BlockchainOperationUpdateInput {
    return {
      status: BlockchainOperationStatus.CONFIRMED,
      transactionHash: confirmation.txHash,
      nonce: this.toBigIntOrUndefined(confirmation.nonce),
      blockNumber: this.toBigIntOrUndefined(confirmation.blockNumber),
      chainId: confirmation.chainId,
      contractAddress: confirmation.contractAddress,
      submittedAt: { set: new Date() },
      confirmedAt: new Date(),
      lastErrorCode: null,
      lastErrorMessage: null,
      nextRetryAt: null,
    };
  }

  private toFailureStatus(
    failureKind: BlockchainOperationFailureKind,
  ): BlockchainOperationStatus {
    switch (failureKind) {
      case 'permanent':
        return BlockchainOperationStatus.FAILED_PERMANENT;
      case 'reconciliation':
        return BlockchainOperationStatus.RECONCILIATION_REQUIRED;
      default:
        return BlockchainOperationStatus.FAILED_RETRYABLE;
    }
  }

  private getErrorDetails(error: unknown): {
    code: string | null;
    message: string;
  } {
    if (error instanceof Error) {
      const errorRecord = error as Error & { code?: unknown };
      return {
        code: typeof errorRecord.code === 'string' ? errorRecord.code : null,
        message: error.message || 'Unknown blockchain operation error',
      };
    }

    return {
      code: null,
      message: 'Unknown blockchain operation error',
    };
  }

  private toBigIntOrUndefined(
    value: number | bigint | null | undefined,
  ): bigint | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return typeof value === 'bigint' ? value : BigInt(value);
  }
}
