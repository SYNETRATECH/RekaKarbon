import {
  BlockchainOperationType,
  PtbaeBlockchainAnchorType,
} from '@prisma/client';
import { ethers } from 'ethers';
import type { CreateBlockchainOperationInput } from './types';

const DEFAULT_ACTIVE_CHAIN_ID = 1338;

export function getConfiguredBlockchainChainId(): number | null {
  const rawValue =
    process.env.BESU_CHAIN_ID?.trim() || process.env.QBFT_CHAIN_ID?.trim();
  if (!rawValue) return DEFAULT_ACTIVE_CHAIN_ID;

  const chainId = Number(rawValue);
  return Number.isInteger(chainId) && chainId > 0 ? chainId : null;
}

export function getConfiguredRegistryAddress(): string | null {
  const address = process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS?.trim();
  return address || null;
}

export function getConfiguredTokenAddress(): string | null {
  const address = process.env.CARBON_TOKEN_CONTRACT_ADDRESS?.trim();
  return address || null;
}

export function getPtbaeAnchorOperationIdempotencyKey(
  applicationVersionId: string,
  anchorType: PtbaeBlockchainAnchorType,
): string {
  return `ptbae-anchor:${applicationVersionId}:${anchorType}`;
}

export function createPtbaeAnchorOperationInput(
  applicationId: string,
  applicationVersionId: string,
  anchorType: PtbaeBlockchainAnchorType,
  merkleRoot: string,
): CreateBlockchainOperationInput {
  return {
    operationType: BlockchainOperationType.PTBAE_ANCHOR,
    aggregateType: 'PTBAE_APPLICATION',
    aggregateId: applicationId,
    idempotencyKey: getPtbaeAnchorOperationIdempotencyKey(
      applicationVersionId,
      anchorType,
    ),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredRegistryAddress(),
    functionName: 'anchorPtbaeApplication',
    payloadHash: merkleRoot,
  };
}

export function getPtbaeQuotaIssuanceOperationIdempotencyKey(
  applicationId: string,
  complianceYear: number,
): string {
  return `ptbae-quota-issuance:${applicationId}:${complianceYear}`;
}

export function createPtbaeQuotaIssuanceOperationInput(
  applicationId: string,
  complianceYear: number,
  walletAddress: string,
  quotaTCO2e: number,
): CreateBlockchainOperationInput {
  const normalizedWalletAddress = ethers.getAddress(walletAddress);
  const normalizedQuota = quotaTCO2e.toFixed(2);

  return {
    operationType: BlockchainOperationType.PTBAE_QUOTA_ISSUANCE,
    aggregateType: 'PTBAE_APPLICATION',
    aggregateId: applicationId,
    idempotencyKey: getPtbaeQuotaIssuanceOperationIdempotencyKey(
      applicationId,
      complianceYear,
    ),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredTokenAddress(),
    functionName: 'issueQuota',
    functionSelector: ethers.id('issueQuota(address,uint256)').slice(0, 10),
    payloadHash: ethers.keccak256(
      ethers.toUtf8Bytes(
        `ptbae-quota:${applicationId}:${complianceYear}:${normalizedWalletAddress}:${normalizedQuota}`,
      ),
    ),
  };
}

export function getBursaListingConfigureOperationIdempotencyKey(
  listingId: string,
): string {
  return `bursa-listing-configure:${listingId}`;
}

export function createBursaListingConfigureOperationInput(
  listingId: string,
  kthRepresentative: string,
): CreateBlockchainOperationInput {
  const normalizedRepresentative = ethers.getAddress(kthRepresentative);

  return {
    operationType: BlockchainOperationType.BURSA_LISTING_CONFIGURE,
    aggregateType: 'BURSA_LISTING',
    aggregateId: listingId,
    idempotencyKey: getBursaListingConfigureOperationIdempotencyKey(listingId),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredTokenAddress(),
    functionName: 'confirmBursaListing',
    functionSelector: ethers
      .id('confirmBursaListing(uint256,address)')
      .slice(0, 10),
    payloadHash: ethers.keccak256(
      ethers.toUtf8Bytes(
        `bursa-listing-configure:${listingId}:${normalizedRepresentative}`,
      ),
    ),
  };
}

export function getBursaListingActivateOperationIdempotencyKey(
  listingId: string,
): string {
  return `bursa-listing-activate:${listingId}`;
}

export function createBursaListingActivateOperationInput(
  listingId: string,
): CreateBlockchainOperationInput {
  return {
    operationType: BlockchainOperationType.BURSA_LISTING_ACTIVATE,
    aggregateType: 'BURSA_LISTING',
    aggregateId: listingId,
    idempotencyKey: getBursaListingActivateOperationIdempotencyKey(listingId),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredTokenAddress(),
    functionName: 'activateBursaListing',
    functionSelector: ethers.id('activateBursaListing(uint256)').slice(0, 10),
    payloadHash: ethers.keccak256(
      ethers.toUtf8Bytes(`bursa-listing-activate:${listingId}`),
    ),
  };
}

export function getBursaListingCancelOperationIdempotencyKey(
  listingId: string,
): string {
  return `bursa-listing-cancel:${listingId}`;
}

export function createBursaListingCancelOperationInput(
  listingId: string,
  blockchainListingId: number,
): CreateBlockchainOperationInput {
  return {
    operationType: BlockchainOperationType.BURSA_LISTING_CANCEL,
    aggregateType: 'BURSA_LISTING',
    aggregateId: listingId,
    idempotencyKey: getBursaListingCancelOperationIdempotencyKey(listingId),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredTokenAddress(),
    functionName: 'cancelBursaListing',
    functionSelector: ethers.id('cancelBursaListing(uint256)').slice(0, 10),
    payloadHash: ethers.keccak256(
      ethers.toUtf8Bytes(
        `bursa-listing-cancel:${listingId}:${blockchainListingId}`,
      ),
    ),
  };
}

export function getBursaMarketPriceUpdateOperationIdempotencyKey(
  listingId: string,
  marketPricePerTonIdr: number,
): string {
  return `bursa-market-price:${listingId}:${marketPricePerTonIdr}`;
}

export function createBursaMarketPriceUpdateOperationInput(
  listingId: string,
  blockchainListingId: number,
  marketPricePerTonIdr: number,
): CreateBlockchainOperationInput {
  return {
    operationType: BlockchainOperationType.BURSA_LISTING_PRICE_UPDATE,
    aggregateType: 'BURSA_LISTING',
    aggregateId: listingId,
    idempotencyKey: getBursaMarketPriceUpdateOperationIdempotencyKey(
      listingId,
      marketPricePerTonIdr,
    ),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredTokenAddress(),
    functionName: 'updateBursaMarketPrice',
    functionSelector: ethers
      .id('updateBursaMarketPrice(uint256,uint256)')
      .slice(0, 10),
    payloadHash: ethers.keccak256(
      ethers.toUtf8Bytes(
        `bursa-market-price:${listingId}:${blockchainListingId}:${marketPricePerTonIdr}`,
      ),
    ),
  };
}

export function getBursaPurchaseOperationIdempotencyKey(
  orderId: string,
): string {
  return `bursa-purchase:${orderId}`;
}

export function createBursaPurchaseOperationInput(
  orderId: string,
  listingId: string,
  blockchainListingId: number,
  buyerWallet: string,
  amountTco2e: number,
  maxTotalCostRkb: number,
): CreateBlockchainOperationInput {
  const normalizedBuyerWallet = ethers.getAddress(buyerWallet);
  const normalizedAmount = amountTco2e.toFixed(2);
  const normalizedMaxCost = maxTotalCostRkb.toFixed(2);

  return {
    operationType: BlockchainOperationType.BURSA_LISTING_PURCHASE,
    aggregateType: 'BURSA_ORDER',
    aggregateId: orderId,
    idempotencyKey: getBursaPurchaseOperationIdempotencyKey(orderId),
    chainId: getConfiguredBlockchainChainId(),
    contractAddress: getConfiguredTokenAddress(),
    functionName: 'purchaseBursaListing',
    functionSelector: ethers
      .id('purchaseBursaListing(uint256,address,uint256,uint256)')
      .slice(0, 10),
    payloadHash: ethers.keccak256(
      ethers.toUtf8Bytes(
        `bursa-purchase:${orderId}:${listingId}:${blockchainListingId}:${normalizedBuyerWallet}:${normalizedAmount}:${normalizedMaxCost}`,
      ),
    ),
  };
}
