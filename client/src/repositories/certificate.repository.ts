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

export const certificateRepository: CertificateRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./certificate.mock.repository')).MockCertificateRepository()
    : new ApiCertificateRepository();
