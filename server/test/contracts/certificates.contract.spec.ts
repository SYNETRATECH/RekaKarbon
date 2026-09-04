import { CertificatesController } from '../../src/certificates/certificates.controller';
import { CertificatesService } from '../../src/certificates/certificates.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  PurchasedCertificateSchema,
  RetirementCertificateResultSchema,
  RetirementCertificateHistorySchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('Certificates API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockCertificate = {
    id: 'c1e2f3a4-0001-4000-8000-000000000001',
    certificateNumber: 'SPE-BALURAN-2025-001',
    projectName: 'TN Baluran Restorasi',
    projectCategory: 'Restorasi Hutan Dataran Rendah',
    location: 'Situbondo, Jawa Timur',
    coordinates: [-7.8385, 114.3725] as [number, number],
    purchasedVolumeTCO2e: 1200,
    pricePerTonIDR: 260000,
    totalPaidIDR: 312000000,
    purchaseDate: '2026-02-14',
    registryStandard: 'SRN-PPI / KLHK Permen 21/2022',
    blockchainTxHash:
      '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    projectCondition: {
      canopyDensityPercent: 88.5,
      carbonSequestrationRate: 1.24,
      kthIncentiveDisbursed: 150000000,
      droneAuditStatus: 'Terverifikasi (LiDAR Multi-Spectral)',
      lastSpatialAuditDate: '2026-02-10',
    },
  };

  const mockRetirementItem = {
    certificateId: 101,
    certificateNumber: 'SPE-BALURAN-2025-001',
    retiree: '0x8f2a948571029485710294857102948571029485',
    assetId: 1,
    amountRetired: 250,
    txHash:
      '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    blockNumber: 184510,
    retiredAt: '2026-02-14T12:00:00Z',
    chainId: 1337,
    contractAddress: '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  };

  const mockCertificatesService = {
    getPurchasedCertificates: jest.fn().mockResolvedValue([mockCertificate]),
    getRetirementHistory: jest.fn().mockResolvedValue([mockRetirementItem]),
    retireCarbonToken: jest.fn().mockResolvedValue({
      txHash: mockCertificate.blockchainTxHash,
      certificateNumber: mockCertificate.certificateNumber,
      volumeRetired: 250,
      assetId: 1,
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [CertificatesController],
      providers: [
        { provide: CertificatesService, useValue: mockCertificatesService },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /emitter/certificates returns array conforming to PurchasedCertificateSchema', async () => {
    const res = await harness.http.get('/emitter/certificates').expect(200);
    const list = expectContract(res.body, z.array(PurchasedCertificateSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].certificateNumber).toBe('SPE-BALURAN-2025-001');
    expect(list[0].projectCondition.droneAuditStatus).toBeDefined();
  });

  it('GET /emitter/certificates/retired satisfies RetirementCertificateHistorySchema', async () => {
    const res = await harness.http
      .get('/emitter/certificates/retired')
      .expect(200);
    const list = expectContract(res.body, RetirementCertificateHistorySchema);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].certificateId).toBe(101);
  });

  it('POST /emitter/certificates/retire returns RetirementCertificateResultSchema', async () => {
    const res = await harness.http
      .post('/emitter/certificates/retire')
      .send({
        tokenId: 'b1c2d3e4-0001-4000-8000-000000000001',
        volumeTco2e: 250,
      })
      .expect(201);

    const result = expectContract(res.body, RetirementCertificateResultSchema);
    expect(result.volumeRetired).toBe(250);
    expect(result.certificateNumber).toBe('SPE-BALURAN-2025-001');
  });
});
