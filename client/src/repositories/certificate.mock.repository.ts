import type { CertificateRepository } from './certificate.repository';
import type {
  PurchasedCertificate,
  RetirementCertificateHistoryItem,
  RetirementCertificateResult,
  RetirementCertificateVerification,
} from '../types';
import { MOCK_PURCHASED_CERTIFICATES } from '../lib/mock/certificates';

export class MockCertificateRepository implements CertificateRepository {
  private lastRetirement: RetirementCertificateResult | null = null;
  private readonly retirementHistory: RetirementCertificateHistoryItem[] = [
    {
      certificateId: 1,
      certificateNumber: 'SPE-RET-2026-SEMEN-NUSANTARA-001',
      retiree: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      assetId: 1,
      amountRetired: 2330,
      txHash: '0x8831a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      blockNumber: 14890,
      retiredAt: '2026-02-15T10:00:00.000Z',
      chainId: 1337,
      contractAddress: '0x9FBDa871d559710256a2502A2517b794B482Db40',
    },
  ];

  async getPurchasedCertificates(): Promise<PurchasedCertificate[]> {
    return MOCK_PURCHASED_CERTIFICATES;
  }

  async getRetirementHistory(): Promise<RetirementCertificateHistoryItem[]> {
    return this.retirementHistory;
  }

  async retireCertificate(
    tokenId: string,
    volumeTco2e: number
  ): Promise<RetirementCertificateResult> {
    console.log(`[MOCK] Retire Carbon Token ${tokenId} volume ${volumeTco2e}`);
    const result: RetirementCertificateResult = {
      txHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      certificateNumber: `SPE-RET-${Date.now()}`,
      volumeRetired: volumeTco2e,
      assetId: 1,
    };
    this.lastRetirement = result;
    this.retirementHistory.unshift({
      certificateId: this.retirementHistory.length + 1,
      certificateNumber: result.certificateNumber,
      retiree: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
      assetId: result.assetId,
      amountRetired: result.volumeRetired,
      txHash: result.txHash,
      blockNumber: this.retirementHistory.length + 1,
      retiredAt: new Date().toISOString(),
      chainId: 1337,
      contractAddress: '0x9FBDa871d559710256a2502A2517b794B482Db40',
    });
    return Promise.resolve(result);
  }

  async verifyRetirementCertificate(txHash: string): Promise<RetirementCertificateVerification> {
    if (!this.lastRetirement || this.lastRetirement.txHash !== txHash) {
      throw new Error('Sertifikat retirement mock tidak ditemukan.');
    }

    const verification = this.retirementHistory.find((item) => item.txHash === txHash);
    if (!verification) throw new Error('Sertifikat retirement mock tidak ditemukan.');
    return verification;
  }
}
