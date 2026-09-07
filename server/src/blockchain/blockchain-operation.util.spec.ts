import { BlockchainOperationType } from '@prisma/client';
import { ethers } from 'ethers';
import {
  createBursaListingActivateOperationInput,
  createBursaListingCancelOperationInput,
  createBursaListingConfigureOperationInput,
  createBursaMarketPriceUpdateOperationInput,
  createBursaPurchaseOperationInput,
  createPtbaeQuotaIssuanceOperationInput,
  getBursaListingActivateOperationIdempotencyKey,
  getBursaListingCancelOperationIdempotencyKey,
  getBursaListingConfigureOperationIdempotencyKey,
  getBursaMarketPriceUpdateOperationIdempotencyKey,
  getBursaPurchaseOperationIdempotencyKey,
  getPtbaeQuotaIssuanceOperationIdempotencyKey,
} from './blockchain-operation.util';

describe('blockchain-operation.util', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment };
    process.env.BESU_CHAIN_ID = '1338';
    process.env.CARBON_TOKEN_CONTRACT_ADDRESS =
      '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0';
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('builds a stable idempotency key for one application and year', () => {
    expect(
      getPtbaeQuotaIssuanceOperationIdempotencyKey('application-1', 2026),
    ).toBe('ptbae-quota-issuance:application-1:2026');
  });

  it('builds a hashed quota issuance operation payload', () => {
    const operation = createPtbaeQuotaIssuanceOperationInput(
      'application-1',
      2026,
      '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      120000.5,
    );

    expect(operation).toEqual(
      expect.objectContaining({
        operationType: BlockchainOperationType.PTBAE_QUOTA_ISSUANCE,
        aggregateType: 'PTBAE_APPLICATION',
        aggregateId: 'application-1',
        idempotencyKey: 'ptbae-quota-issuance:application-1:2026',
        chainId: 1338,
        contractAddress: '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0',
        functionName: 'issueQuota',
        functionSelector: ethers.id('issueQuota(address,uint256)').slice(0, 10),
      }),
    );
    expect(operation.payloadHash).toMatch(/^0x[0-9a-f]{64}$/u);
  });

  it('builds stable Bursa confirmation and activation operations', () => {
    const configureOperation = createBursaListingConfigureOperationInput(
      'listing-1',
      '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    );
    const activateOperation =
      createBursaListingActivateOperationInput('listing-1');

    expect(configureOperation).toEqual(
      expect.objectContaining({
        operationType: BlockchainOperationType.BURSA_LISTING_CONFIGURE,
        aggregateType: 'BURSA_LISTING',
        aggregateId: 'listing-1',
        idempotencyKey:
          getBursaListingConfigureOperationIdempotencyKey('listing-1'),
        functionName: 'confirmBursaListing',
        functionSelector: ethers
          .id('confirmBursaListing(uint256,address)')
          .slice(0, 10),
      }),
    );
    expect(activateOperation).toEqual(
      expect.objectContaining({
        operationType: BlockchainOperationType.BURSA_LISTING_ACTIVATE,
        aggregateType: 'BURSA_LISTING',
        aggregateId: 'listing-1',
        idempotencyKey:
          getBursaListingActivateOperationIdempotencyKey('listing-1'),
        functionName: 'activateBursaListing',
        functionSelector: ethers
          .id('activateBursaListing(uint256)')
          .slice(0, 10),
      }),
    );
    expect(configureOperation.payloadHash).toMatch(/^0x[0-9a-f]{64}$/u);
    expect(activateOperation.payloadHash).toMatch(/^0x[0-9a-f]{64}$/u);
  });

  it('builds stable Bursa cancellation and price update operations', () => {
    const cancelOperation = createBursaListingCancelOperationInput(
      'listing-1',
      17,
    );
    const priceUpdateOperation = createBursaMarketPriceUpdateOperationInput(
      'listing-1',
      17,
      125000,
    );

    expect(cancelOperation).toEqual(
      expect.objectContaining({
        operationType: BlockchainOperationType.BURSA_LISTING_CANCEL,
        aggregateType: 'BURSA_LISTING',
        aggregateId: 'listing-1',
        idempotencyKey:
          getBursaListingCancelOperationIdempotencyKey('listing-1'),
        functionName: 'cancelBursaListing',
        functionSelector: ethers.id('cancelBursaListing(uint256)').slice(0, 10),
      }),
    );
    expect(priceUpdateOperation).toEqual(
      expect.objectContaining({
        operationType: BlockchainOperationType.BURSA_LISTING_PRICE_UPDATE,
        aggregateType: 'BURSA_LISTING',
        aggregateId: 'listing-1',
        idempotencyKey: getBursaMarketPriceUpdateOperationIdempotencyKey(
          'listing-1',
          125000,
        ),
        functionName: 'updateBursaMarketPrice',
        functionSelector: ethers
          .id('updateBursaMarketPrice(uint256,uint256)')
          .slice(0, 10),
      }),
    );
    expect(cancelOperation.payloadHash).toMatch(/^0x[0-9a-f]{64}$/u);
    expect(priceUpdateOperation.payloadHash).toMatch(/^0x[0-9a-f]{64}$/u);
  });

  it('builds a stable Bursa purchase operation from the order identity', () => {
    const operation = createBursaPurchaseOperationInput(
      'order-1',
      'listing-1',
      17,
      '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      125.25,
      2500000,
    );

    expect(operation).toEqual(
      expect.objectContaining({
        operationType: BlockchainOperationType.BURSA_LISTING_PURCHASE,
        aggregateType: 'BURSA_ORDER',
        aggregateId: 'order-1',
        idempotencyKey: getBursaPurchaseOperationIdempotencyKey('order-1'),
        functionName: 'purchaseBursaListing',
        functionSelector: ethers
          .id('purchaseBursaListing(uint256,address,uint256,uint256)')
          .slice(0, 10),
      }),
    );
    expect(operation.payloadHash).toMatch(/^0x[0-9a-f]{64}$/u);
  });
});
