import { BlockchainOperationType } from '@prisma/client';

export interface CreateBlockchainOperationInput {
  operationType: BlockchainOperationType;
  aggregateType: string;
  aggregateId: string;
  idempotencyKey: string;
  chainId: number | null;
  contractAddress: string | null;
  functionName: string;
  functionSelector?: string | null;
  payloadHash: string;
}

export interface BlockchainOperationConfirmation {
  txHash: string;
  blockNumber?: number | bigint | null;
  chainId?: number | null;
  contractAddress?: string | null;
  nonce?: number | bigint | null;
}

export type BlockchainOperationFailureKind =
  'retryable' | 'permanent' | 'reconciliation';
