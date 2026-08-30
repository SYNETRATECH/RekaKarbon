export interface BlockchainTransactionReceipt {
  hash: string;
  logs: BlockchainLog[];
  blockNumber?: number | bigint;
}

export interface BlockchainTransaction {
  wait(): Promise<BlockchainTransactionReceipt | null>;
}

export interface BlockchainTransactionOverrides {
  gasPrice?: number | bigint;
}

export interface BlockchainHealth {
  status: 'ready' | 'degraded' | 'offline' | 'unconfigured';
  network: string;
  configuredChainId?: number;
  connectedChainId?: number;
  contractAddress?: string;
  contractDeployed?: boolean;
  ministryRoleGrantedToSigner?: boolean;
  reason?: string;
}

export interface BlockchainEvent {
  args: readonly [string, string, string, bigint, bigint];
  getBlock(): Promise<{ timestamp: number }>;
  transactionHash: string;
}

export interface BlockchainLog {
  fragment?: {
    name?: string;
  };
  args?: readonly [bigint, ...unknown[]];
}

export interface CarbonTokenContract {
  balanceOf(address: string, tokenId: number): Promise<bigint>;
  issueQuota(
    toAddress: string,
    amount: bigint,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  MINISTRY_ROLE(): Promise<string>;
  hasRole(role: string, account: string): Promise<boolean>;
  mintOffsetCredit(
    toAddress: string,
    amount: number,
    coordinates: string,
  ): Promise<BlockchainTransaction>;
  mintWalletCredit(
    toAddress: string,
    amountIdr: number,
  ): Promise<BlockchainTransaction>;
  executeBursaPurchase(
    buyer: string,
    seller: string,
    assetId: number,
    amountTco2e: number,
    totalCost: number,
  ): Promise<BlockchainTransaction>;
  retireCarbonWithCertificate(
    assetId: number,
    amountTco2e: number,
    certNumber: string,
  ): Promise<BlockchainTransaction>;
  filters: {
    TransferSingle(
      operator: string | null,
      from: string | null,
      to: string | null,
    ): unknown;
  };
  queryFilter(
    filter: unknown,
    fromBlock: number,
    toBlock: number | 'latest',
  ): Promise<BlockchainEvent[]>;
}

export interface EmissionRegistryContract {
  submitReport(year: number, rootHash: string): Promise<BlockchainTransaction>;
  anchorPtbaeApplication(
    applicationId: string,
    version: number,
    rootHash: string,
    anchorType: number,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
}
