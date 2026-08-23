import type { PurchasedCertificate } from '../types';
import { api } from '../lib/api';

export interface CertificateRepository {
  getPurchasedCertificates(): Promise<PurchasedCertificate[]>;
}

export class ApiCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return api.get<PurchasedCertificate[]>('/emitter/certificates');
  }
}

import { MockCertificateRepository } from './certificate.mock.repository';

export const certificateRepository: CertificateRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockCertificateRepository()
    : new ApiCertificateRepository();
