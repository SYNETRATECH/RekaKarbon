import {
  BlockchainOperationStatus,
  BlockchainOperationType,
} from '@prisma/client';
import { BlockchainOperationService } from './blockchain-operation.service';
import type { CreateBlockchainOperationInput } from './types';
import { PrismaService } from '../prisma/prisma.service';

describe('BlockchainOperationService', () => {
  const input: CreateBlockchainOperationInput = {
    operationType: BlockchainOperationType.PTBAE_ANCHOR,
    aggregateType: 'PTBAE_APPLICATION',
    aggregateId: 'application-1',
    idempotencyKey: 'ptbae-anchor:version-1:APPLICATION_SUBMISSION',
    chainId: 1338,
    contractAddress: '0x0000000000000000000000000000000000000001',
    functionName: 'anchorPtbaeApplication',
    payloadHash:
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };

  it('uses the idempotency key as the upsert identity', async () => {
    const upsert = jest.fn().mockResolvedValue({
      id: 'operation-1',
      idempotencyKey: input.idempotencyKey,
    });
    const prisma = {
      blockchainOperation: { upsert },
    } as unknown as PrismaService;
    const service = new BlockchainOperationService(prisma);

    await service.ensurePendingOperation(input);

    expect(upsert).toHaveBeenCalledWith({
      where: { idempotencyKey: input.idempotencyKey },
      create: expect.objectContaining({
        operationType: input.operationType,
        aggregateId: input.aggregateId,
        idempotencyKey: input.idempotencyKey,
      }),
      update: {},
    });
  });

  it('stores a confirmed transaction with its chain metadata', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'operation-1',
      status: BlockchainOperationStatus.CONFIRMED,
    });
    const prisma = {
      blockchainOperation: { update },
    } as unknown as PrismaService;
    const service = new BlockchainOperationService(prisma);

    await service.markConfirmed(input.idempotencyKey, {
      txHash:
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      blockNumber: 42,
      chainId: 1338,
      contractAddress: input.contractAddress,
    });

    expect(update).toHaveBeenCalledWith({
      where: { idempotencyKey: input.idempotencyKey },
      data: expect.objectContaining({
        status: BlockchainOperationStatus.CONFIRMED,
        transactionHash:
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        blockNumber: 42n,
        chainId: 1338,
        contractAddress: input.contractAddress,
      }),
    });
  });

  it('marks transient failures as retryable', async () => {
    const update = jest.fn().mockResolvedValue({
      id: 'operation-1',
      status: BlockchainOperationStatus.FAILED_RETRYABLE,
    });
    const prisma = {
      blockchainOperation: { update },
    } as unknown as PrismaService;
    const service = new BlockchainOperationService(prisma);
    const retryAt = new Date('2026-09-06T00:00:00.000Z');

    await service.markFailed(
      input.idempotencyKey,
      new Error('RPC unavailable'),
      'retryable',
      retryAt,
    );

    expect(update).toHaveBeenCalledWith({
      where: { idempotencyKey: input.idempotencyKey },
      data: expect.objectContaining({
        status: BlockchainOperationStatus.FAILED_RETRYABLE,
        lastErrorMessage: 'RPC unavailable',
        nextRetryAt: retryAt,
      }),
    });
  });

  it('claims a pending operation atomically before execution', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findUnique = jest.fn().mockResolvedValue({
      id: 'operation-1',
      idempotencyKey: input.idempotencyKey,
      status: BlockchainOperationStatus.SUBMITTED,
    });
    const prisma = {
      blockchainOperation: { updateMany, findUnique },
    } as unknown as PrismaService;
    const service = new BlockchainOperationService(prisma);

    const operation = await service.claimForExecution(input.idempotencyKey);

    expect(operation?.status).toBe(BlockchainOperationStatus.SUBMITTED);
    expect(updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        idempotencyKey: input.idempotencyKey,
        status: {
          in: [
            BlockchainOperationStatus.PENDING,
            BlockchainOperationStatus.FAILED_RETRYABLE,
          ],
        },
      }),
      data: expect.objectContaining({
        status: BlockchainOperationStatus.SUBMITTED,
      }),
    });
    const updateCall = updateMany.mock.calls[0] as [
      { data: { submittedAt: unknown } },
    ];
    expect(updateCall[0].data.submittedAt).toBeInstanceOf(Date);
    expect(findUnique).toHaveBeenCalledWith({
      where: { idempotencyKey: input.idempotencyKey },
    });
  });

  it('returns null when another worker already claimed the operation', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const findUnique = jest.fn();
    const prisma = {
      blockchainOperation: { updateMany, findUnique },
    } as unknown as PrismaService;
    const service = new BlockchainOperationService(prisma);

    await expect(
      service.claimForExecution(input.idempotencyKey),
    ).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
