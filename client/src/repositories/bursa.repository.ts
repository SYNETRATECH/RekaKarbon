import type { BursaItem } from '../types';
import { api } from '../lib/api';

export interface BursaRepository {
  getBursaItems(): Promise<BursaItem[]>;
}

export class ApiBursaRepository implements BursaRepository {
  async getBursaItems(): Promise<BursaItem[]> {
    return api.get<BursaItem[]>('/emitter/bursa');
  }
}

export const bursaRepository: BursaRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./bursa.mock.repository')).MockBursaRepository()
    : new ApiBursaRepository();
