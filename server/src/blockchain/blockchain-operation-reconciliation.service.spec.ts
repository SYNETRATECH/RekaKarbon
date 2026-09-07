import { BlockchainOperationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainOperationService } from './blockchain-operation.service';
import { BlockchainOperationReconciliationService } from './blockchain-operation-reconciliation.service';
import { BlockchainService } from './blockchain.service';
import type { BlockchainTransactionStatus } from './types';

describe('BlockchainOperationReconciliationService', () => {
  const transactionHash =
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const contractAddress = '0x0000000000000000000000000000000000000001';

  function createOperation() {
    return {
      id: 'operation-1',
      idempotencyKey: 'ptbae-anchor:version-1:APPLICATION_SUBMISSION',
      status: BlockchainOperationStatus.SUBMITTED,
      transactionHash,
      chainId: 1338,
      contractAddress,
    } as const;
  }

  function createService(
    operation = createOperation(),
    transactionStatus?: BlockchainTransactionStatus,
  ) {
    const findMany = jest.fn().mockResolvedValue([operation]);
    const getTransactionStatus = jest.fn().mockResolvedValue(transactionStatus);
    const markConfirmed = jest.fn().mockResolvedValue({});
    const markFailed = jest.fn().mockResolvedValue({});

    const prisma = {
      blockchainOperation: { findMany },
    } as unknown as PrismaService;
    const blockchainService = {
      getTransactionStatus,
    } as unknown as BlockchainService;
    const operationService = {
      markConfirmed,
      markFailed,
    } as unknown as BlockchainOperationService;

    return {
      service: new BlockchainOperationReconciliationService(
        prisma,
        blockchainService,
        operationService,
      ),
      findMany,
      getTransactionStatus,
      markConfirmed,
      markFailed,
    };
  }

  it('confirms a submitted operation after a successful receipt', async () => {
    const result = createService(createOperation(), {
      status: 'confirmed',
      txHash: transactionHash,
      blockNumber: 42,
      chainId: 1338,
      contractAddress,
    });

    await expect(
      result.service.reconcileSubmittedOperations(),
    ).resolves.toEqual({
      scanned: 1,
      confirmed: 1,
      failed: 0,
      pending: 0,
      mismatched: 0,
      errors: 0,
    });
    expect(result.findMany).toHaveBeenCalledWith({
      where: {
        status: BlockchainOperationStatus.SUBMITTED,
        transactionHash: { not: null },
      },
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      take: 20,
    });
    expect(result.markConfirmed).toHaveBeenCalledWith(
      createOperation().idempotencyKey,
      {
        txHash: transactionHash,
        blockNumber: 42,
        chainId: 1338,
        contractAddress,
      },
    );
  });

  it('leaves an operation submitted while its receipt is pending', async () => {
    const result = createService(createOperation(), {
      status: 'pending',
      txHash: transactionHash,
      blockNumber: null,
      chainId: 1338,
      contractAddress: null,
    });

    await expect(
      result.service.reconcileSubmittedOperations(),
    ).resolves.toEqual(expect.objectContaining({ scanned: 1, pending: 1 }));
    expect(result.markConfirmed).not.toHaveBeenCalled();
    expect(result.markFailed).not.toHaveBeenCalled();
  });

  it('marks a mined revert as a permanent failure', async () => {
    const result = createService(createOperation(), {
      status: 'failed',
      txHash: transactionHash,
      blockNumber: 43,
      chainId: 1338,
      contractAddress,
    });

    await result.service.reconcileSubmittedOperations();

    expect(result.markFailed).toHaveBeenCalledWith(
      createOperation().idempotencyKey,
      expect.any(Error),
      'permanent',
    );
  });

  it('marks a receipt targeting another contract for reconciliation', async () => {
    const result = createService(createOperation(), {
      status: 'confirmed',
      txHash: transactionHash,
      blockNumber: 44,
      chainId: 1338,
      contractAddress: '0x0000000000000000000000000000000000000002',
    });

    await result.service.reconcileSubmittedOperations();

    expect(result.markFailed).toHaveBeenCalledWith(
      createOperation().idempotencyKey,
      expect.any(Error),
      'reconciliation',
    );
    expect(result.markConfirmed).not.toHaveBeenCalled();
  });

  it('keeps the operation unchanged when the RPC check fails', async () => {
    const result = createService();
    result.getTransactionStatus.mockRejectedValueOnce(new Error('RPC down'));

    await expect(
      result.service.reconcileSubmittedOperations(),
    ).resolves.toEqual(expect.objectContaining({ scanned: 1, errors: 1 }));
    expect(result.markConfirmed).not.toHaveBeenCalled();
    expect(result.markFailed).not.toHaveBeenCalled();
  });
});
