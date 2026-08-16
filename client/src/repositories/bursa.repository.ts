import type { BursaItem } from '../types';
import { MOCK_BURSA_ITEMS } from '../lib/mock/bursa';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface BursaRepository {
  getBursaItems(): Promise<BursaItem[]>;
}

class MockBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return MOCK_BURSA_ITEMS;
  }
}

class ApiBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return api.get<BursaItem[]>('/emitter/bursa');
  }
}

export const bursaRepository: BursaRepository = useMock
  ? new MockBursaRepository()
  : new ApiBursaRepository();
