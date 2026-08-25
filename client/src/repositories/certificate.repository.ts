import type { PurchasedCertificate } from '../types';
import { api } from '../lib/api';

export interface CertificateRepository {
  getPurchasedCertificates(): Promise<PurchasedCertificate[]>;
  retireCertificate(assetId: number, volume: number, certNumber: string): Promise<{ txHash: string }>;
}

export class ApiCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return api.get<PurchasedCertificate[]>('/emitter/certificates');
  }

  async retireCertificate(assetId: number, volume: number, certNumber: string): Promise<{ txHash: string }> {
    return api.post<{ txHash: string }>('/emitter/certificates/retire', { assetId, volume, certNumber });
  }
}

import { MockCertificateRepository } from './certificate.mock.repository';

export const certificateRepository: CertificateRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockCertificateRepository()
    : new ApiCertificateRepository();
