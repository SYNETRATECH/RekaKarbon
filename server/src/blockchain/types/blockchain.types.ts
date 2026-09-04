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

export interface BlockchainRetirementCertificate {
  certificateId: number;
  certificateNumber: string;
  retiree: string;
  assetId: number;
  amountRetired: number;
  txHash: string;
  blockNumber: number;
  retiredAt: string | null;
  chainId: number;
  contractAddress: string;
}

export interface BlockchainBursaListingResult {
  listingId: number;
  txHash: string;
}

export interface BlockchainBursaQuote {
  unitPricePerTonIdr: number;
  totalCostRkb: number;
}

export interface BlockchainBursaRevenueRecipients {
  platform: string;
  restoration: string;
  maintenance: string;
  monitoring: string;
  buffer: string;
  environmentalIntelligence: string;
}

export interface BlockchainMintOffsetCreditResult {
  tokenId: number;
  txHash: string;
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
  retireCarbonWithCertificateFor(
    retiree: string,
    assetId: number,
    amountTco2e: number,
    certNumber: string,
  ): Promise<BlockchainTransaction>;
  createBursaListing(
    seller: string,
    assetId: bigint,
    amount: bigint,
    floorPricePerTonIdr: bigint,
    projectId: string,
    kthGroupId: string,
    projectSnapshotMerkleRoot: string,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  setBursaListingKthRecipient(
    listingId: bigint,
    kthRecipient: string,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  confirmBursaListing(
    listingId: bigint,
    kthRepresentative: string,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  activateBursaListing(
    listingId: bigint,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  updateBursaMarketPrice(
    listingId: bigint,
    newMarketPricePerTonIdr: bigint,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  quoteBursaPurchase(
    listingId: bigint,
    amount: bigint,
  ): Promise<readonly [bigint, bigint]>;
  platformRecipient(): Promise<string>;
  restorationRecipient(): Promise<string>;
  maintenanceRecipient(): Promise<string>;
  monitoringRecipient(): Promise<string>;
  bufferRecipient(): Promise<string>;
  environmentalIntelligenceRecipient(): Promise<string>;
  purchaseBursaListing(
    listingId: bigint,
    buyer: string,
    amount: bigint,
    maxTotalCostRkb: bigint,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  cancelBursaListing(
    listingId: bigint,
    overrides?: BlockchainTransactionOverrides,
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
  submitReportFor(
    reporter: string,
    year: number,
    rootHash: string,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  auditReport(
    reportId: number,
    status: number,
    notes: string,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
  anchorPtbaeApplication(
    applicationId: string,
    version: number,
    rootHash: string,
    anchorType: number,
    overrides?: BlockchainTransactionOverrides,
  ): Promise<BlockchainTransaction>;
}
