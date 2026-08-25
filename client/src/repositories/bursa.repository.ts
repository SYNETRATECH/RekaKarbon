import type { BursaItem } from '../types';
import { api } from '../lib/api';

export interface BursaRepository {
  getBursaItems(): Promise<BursaItem[]>;
  buyCarbonToken(listingId: number, volume: number): Promise<{ txHash: string }>;
}

export class ApiBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return api.get<BursaItem[]>('/emitter/bursa');
  }

  async buyCarbonToken(listingId: number, volume: number): Promise<{ txHash: string }> {
    return api.post<{ txHash: string }>('/emitter/bursa/buy', { listingId, volume });
  }
}

import { MockBursaRepository } from './bursa.mock.repository';

export const bursaRepository: BursaRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockBursaRepository()
    : new ApiBursaRepository();
