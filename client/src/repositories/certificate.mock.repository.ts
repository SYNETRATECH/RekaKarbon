import type { CertificateRepository } from './certificate.repository';
import type { PurchasedCertificate } from '../types';
import { MOCK_PURCHASED_CERTIFICATES } from '../lib/mock/certificates';

export class MockCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return MOCK_PURCHASED_CERTIFICATES;
  }

  async retireCertificate(
    tokenId: string,
    volumeTco2e: number,
  ): Promise<{ txHash: string; certificateNumber: string }> {
    console.log(`[MOCK] Retire Carbon Token ${tokenId} volume ${volumeTco2e}`);
    return Promise.resolve({
      txHash: '0xmocktransactionhash123',
      certificateNumber: `SPE-RET-${Date.now()}`
    });
  }
}
