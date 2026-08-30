import type { BursaItem } from '../types';
import { BursaItemSchema } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface BursaRepository {
  getBursaItems(): Promise<BursaItem[]>;
  buyCarbonToken(listingId: string, volume: number): Promise<{ txHash: string }>;
}

export class ApiBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return api.get<BursaItem[]>('/emitter/bursa', z.array(BursaItemSchema));
  }

  async buyCarbonToken(listingId: string, volume: number): Promise<{ txHash: string }> {
    return api.post<{ txHash: string }>(
      '/emitter/bursa/buy',
      { listingId, volumeTCO2e: volume },
      z.object({ txHash: z.string() })
    );
  }
}

import { MockBursaRepository } from './bursa.mock.repository';

export const bursaRepository: BursaRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockBursaRepository()
    : new ApiBursaRepository();
