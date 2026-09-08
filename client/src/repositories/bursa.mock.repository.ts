import type { BursaRepository } from './bursa.repository';
import type { BursaItem, BursaPurchaseEligibility } from '../types';
import { MOCK_BURSA_ITEMS } from '../lib/mock/bursa';

export class MockBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return MOCK_BURSA_ITEMS;
  }

  async getPurchaseEligibility(): Promise<BursaPurchaseEligibility> {
    return {
      canPurchase: true,
      reason: 'eligible',
      message: 'Perusahaan dapat membeli token untuk menutup defisit emisi.',
      complianceYear: 2026,
      reportId: null,
      reportStatus: 'approved',
      approvedEmissionsTCO2e: 145733.3,
      ptbaeQuotaTCO2e: 100000,
      retiredTCO2e: 0,
      availableTokenBalanceTCO2e: 0,
      complianceDeficitTCO2e: 45733.3,
      purchaseRequirementTCO2e: 45733.3,
    };
  }

  async buyCarbonToken(
    listingId: string,
    volume: number,
    _requestId?: string
  ): Promise<{ txHash: string }> {
    console.log(`[MOCK] Buy Carbon Token ${listingId} volume ${volume}`);
    return Promise.resolve({ txHash: '0xmocktransactionhash123' });
  }
}
