import type { PurchasedCertificate } from '../types';
import { PurchasedCertificateSchema } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface CertificateRepository {
  getPurchasedCertificates(): Promise<PurchasedCertificate[]>;
  retireCertificate(
    tokenId: string,
    volumeTco2e: number
  ): Promise<{ txHash: string; certificateNumber: string }>;
}

export class ApiCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return api.get<PurchasedCertificate[]>(
      '/emitter/certificates',
      z.array(PurchasedCertificateSchema)
    );
  }

  async retireCertificate(
    tokenId: string,
    volumeTco2e: number
  ): Promise<{ txHash: string; certificateNumber: string }> {
    return api.post<{ txHash: string; certificateNumber: string }>(
      '/emitter/certificates/retire',
      {
        tokenId,
        volumeTco2e,
      },
      z.object({ txHash: z.string(), certificateNumber: z.string() })
    );
  }
}

import { MockCertificateRepository } from './certificate.mock.repository';

export const certificateRepository: CertificateRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockCertificateRepository()
    : new ApiCertificateRepository();
