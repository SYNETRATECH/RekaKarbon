import { Injectable } from '@nestjs/common';
import type { PurchasedCertificate } from '../types/certificate';
import { MOCK_PURCHASED_CERTIFICATES } from './certificates.mock';

@Injectable()
export class CertificatesService {
  getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return Promise.resolve(MOCK_PURCHASED_CERTIFICATES);
  }
}
