import type { CertificateRepository } from './certificate.repository';
import type { PurchasedCertificate } from '../types';
import { MOCK_PURCHASED_CERTIFICATES } from '../lib/mock/certificates';

export class MockCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return MOCK_PURCHASED_CERTIFICATES;
  }
}
