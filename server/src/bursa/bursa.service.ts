import { Injectable } from '@nestjs/common';
import type { BursaItem } from '../types/bursa';
import { MOCK_BURSA_ITEMS } from './bursa.mock';

@Injectable()
export class BursaService {
  getBursaItems(): Promise<BursaItem[]> {
    return Promise.resolve(MOCK_BURSA_ITEMS);
  }
}
