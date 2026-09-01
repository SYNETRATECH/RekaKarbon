import type {
  PurchasedCertificate,
  RetirementCertificateHistoryItem,
  RetirementCertificateResult,
  RetirementCertificateVerification,
} from '../types';
import {
  PurchasedCertificateSchema,
  RetirementCertificateHistorySchema,
  RetirementCertificateResultSchema,
  RetirementCertificateVerificationSchema,
} from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface CertificateRepository {
  getPurchasedCertificates(): Promise<PurchasedCertificate[]>;
  getRetirementHistory(): Promise<RetirementCertificateHistoryItem[]>;
  retireCertificate(tokenId: string, volumeTco2e: number): Promise<RetirementCertificateResult>;
  verifyRetirementCertificate(txHash: string): Promise<RetirementCertificateVerification>;
}

export class ApiCertificateRepository implements CertificateRepository {
  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return api.get<PurchasedCertificate[]>(
      '/emitter/certificates',
      z.array(PurchasedCertificateSchema)
    );
  }

  async getRetirementHistory(): Promise<RetirementCertificateHistoryItem[]> {
    return api.get<RetirementCertificateHistoryItem[]>(
      '/emitter/certificates/retired',
      RetirementCertificateHistorySchema
    );
  }

  async retireCertificate(
    tokenId: string,
    volumeTco2e: number
  ): Promise<RetirementCertificateResult> {
    return api.post<RetirementCertificateResult>(
      '/emitter/certificates/retire',
      {
        tokenId,
        volumeTco2e,
      },
      RetirementCertificateResultSchema
    );
  }

  async verifyRetirementCertificate(txHash: string): Promise<RetirementCertificateVerification> {
    return api.get<RetirementCertificateVerification>(
      `/public/certificates/verify/${encodeURIComponent(txHash)}`,
      RetirementCertificateVerificationSchema
    );
  }
}

import { MockCertificateRepository } from './certificate.mock.repository';

export const certificateRepository: CertificateRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockCertificateRepository()
    : new ApiCertificateRepository();
