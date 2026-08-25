import type { CertificateRepository } from './certificate.repository';
import type { PurchasedCertificate } from '../types';
import { MOCK_PURCHASED_CERTIFICATES } from '../lib/mock/certificates';

export class MockCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return MOCK_PURCHASED_CERTIFICATES;
  }

  async retireCertificate(assetId: number, volume: number, certNumber: string): Promise<{ txHash: string }> {
    return Promise.resolve({ txHash: '0xmockretirehash123' });
  }
}
