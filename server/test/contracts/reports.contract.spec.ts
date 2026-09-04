import { ReportsController } from '../../src/reports/reports.controller';
import { ReportsService } from '../../src/reports/reports.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import { EmissionReportSchema } from '../../../client/src/schemas';
import { z } from 'zod';
import { createMockEmissionReport } from '../factories';

describe('Emission Reports API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockReport = createMockEmissionReport({
    id: 'e1e2f3a4-0001-4000-8000-000000000001',
    year: 2025,
    title: 'Laporan Emisi GRK Tahunan 2025',
    fileName: 'Laporan_Emisi_2025_Final.pdf',
    fileSizeBytes: 4850000,
    uploadDate: '2026-02-14',
    status: 'verified' as const,
    totalEmissionsTCO2e: 17330,
    sectors: [
      {
        id: 'sec-001',
        name: 'Pembakaran Stasioner',
        scope: 'Scope 1',
        emissionsTCO2e: 12000,
        percentage: 69.2,
        description: 'Kiln dan burner',
        color: '#10b981',
      },
    ],
    blockchainTxHash:
      '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    blockchainReportId: 104,
    merkleRoot:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    quotaPTBAETCO2e: 15000,
    quotaPTBAEStatus: 'VERIFIED' as const,
    quotaPTBAESourceDocument: 'SK-MENLHK-2025-091',
    method: 'CALCULATOR' as const,
  });

  const mockReportsService = {
    getEmissionReports: jest.fn().mockResolvedValue([mockReport]),
    submitReport: jest.fn().mockResolvedValue({
      reportId: mockReport.id,
      txHash: mockReport.blockchainTxHash,
    }),
    submitCalculatorReport: jest.fn().mockResolvedValue({
      merkleRoot: mockReport.merkleRoot,
      txHash: mockReport.blockchainTxHash,
      blockchainReportId: mockReport.blockchainReportId,
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /emitter/reports satisfies client EmissionReportSchema list contract', async () => {
    const res = await harness.http.get('/emitter/reports').expect(200);
    const reports = expectContract(res.body, z.array(EmissionReportSchema));
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].id).toBe(mockReport.id);
    expect(reports[0].status).toBe('verified');
    expect(reports[0].totalEmissionsTCO2e).toBe(17330);
  });

  it('POST /emitter/reports/submit-calculator returns compliant submission envelope', async () => {
    const payload = {
      year: 2026,
      sector: 'Pembangkit Listrik Tenaga Uap',
      totalEmissions: 15400,
      calculationData: {
        schemaVersion: 2,
        factorSetId: 'esdm_2026',
        scope1: 12000,
        scope2: 3400,
        scope3: 0,
        entries: [],
      },
    };

    const res = await harness.http
      .post('/emitter/reports/submit-calculator')
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.blockchainReportId).toBe(104);
  });
});
