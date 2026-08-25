export interface BlockchainTransactionReceipt {
  hash: string;
  logs: BlockchainLog[];
}

export interface BlockchainTransaction {
  wait(): Promise<BlockchainTransactionReceipt | null>;
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
    toBlock: 'latest',
  ): Promise<BlockchainEvent[]>;
}

export interface EmissionRegistryContract {
  submitReport(year: number, rootHash: string): Promise<BlockchainTransaction>;
}
