import { ComplianceController } from '../../src/compliance/compliance.controller';
import { ComplianceService } from '../../src/compliance/compliance.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import { ComplianceDataSchema } from '../../../client/src/schemas';
import { createMockComplianceData } from '../factories';

describe('Compliance Ledger API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockComplianceData = createMockComplianceData({
    complianceYear: 2026,
    emissionVsQuotaPercent: 115.5,
    emissionIntensity: 0.85,
    emissionIntensityStandard: 0.75,
    carbonDeficit: 2330,
    actualEmissions: 17330,
    quotaPTBAE: 15000,
    quotaPTBAEStatus: 'VERIFIED' as const,
    quotaPTBAESourceDocument: 'SK-MENLHK-2025-091',
    governedBy: 'Permen LHK No. 21/2022',
    administrativeSanction: 'Teguran Tertulis Tahap 1',
    djpReportStatus: 'TERVERIFIKASI',
    annualProductionVolume: 500000,
    carbonPricePerTon: 30000,
    totalEstimatedCostIDR: 69900000,
    annualHistory: [
      { year: '2023', historis: 16000 },
      { year: '2024', historis: 16800 },
      { year: '2025', historis: 17100 },
      { year: '2026', historis: 17330, proyeksi: 15000 },
    ],
  });

  const mockComplianceService = {
    getComplianceData: jest.fn().mockResolvedValue(mockComplianceData),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [ComplianceController],
      providers: [
        { provide: ComplianceService, useValue: mockComplianceService },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /emitter/compliance satisfies client ComplianceDataSchema and envelope', async () => {
    const res = await harness.http
      .get('/emitter/compliance?year=2026')
      .expect(200);
    const data = expectContract(res.body, ComplianceDataSchema);
    expect(data.complianceYear).toBe(2026);
    expect(data.carbonDeficit).toBe(2330);
    expect(data.quotaPTBAEStatus).toBe('VERIFIED');
    expect(data.annualHistory).toHaveLength(4);
  });
});
