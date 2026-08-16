import type { PurchasedCertificate } from '../types';
import { MOCK_PURCHASED_CERTIFICATES } from '../lib/mock/certificates';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface CertificateRepository {
  getPurchasedCertificates(): Promise<PurchasedCertificate[]>;
}

class MockCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return MOCK_PURCHASED_CERTIFICATES;
  }
}

class ApiCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return api.get<PurchasedCertificate[]>('/emitter/certificates');
  }
}

export const certificateRepository: CertificateRepository = useMock
  ? new MockCertificateRepository()
  : new ApiCertificateRepository();
