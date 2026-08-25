import type { BursaRepository } from './bursa.repository';
import type { BursaItem } from '../types';
import { MOCK_BURSA_ITEMS } from '../lib/mock/bursa';

export class MockBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return MOCK_BURSA_ITEMS;
  }

  async buyCarbonToken(listingId: number, volume: number): Promise<{ txHash: string }> {
    return Promise.resolve({ txHash: '0xmocktransactionhash123' });
  }
}
