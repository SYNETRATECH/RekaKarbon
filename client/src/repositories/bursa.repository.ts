import type { BursaItem, BursaPurchaseEligibility } from '../types';
import { BursaItemSchema, BursaPurchaseEligibilitySchema } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface BursaRepository {
  getBursaItems(): Promise<BursaItem[]>;
  getPurchaseEligibility(): Promise<BursaPurchaseEligibility>;
  buyCarbonToken(listingId: string, volume: number): Promise<{ txHash: string }>;
}

export class ApiBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return api.get<BursaItem[]>('/emitter/bursa', z.array(BursaItemSchema));
  }

  async getPurchaseEligibility(): Promise<BursaPurchaseEligibility> {
    return api.get<BursaPurchaseEligibility>(
      '/emitter/bursa/eligibility',
      BursaPurchaseEligibilitySchema
    );
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
