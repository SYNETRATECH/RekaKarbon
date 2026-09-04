import { DjpController } from '../../src/integrations/djp/djp.controller';
import { DjpService } from '../../src/integrations/djp/djp.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  CarbonTaxCalculationSchema,
  StpDocumentSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('DJP Carbon Tax API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockCalculation = {
    companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
    companyName: 'PT Semen Gresik Pabrik Tuban',
    npwp: '01.234.567.8-012.000',
    actualEmissionTCO2e: 17330,
    quotaPTBAETCO2e: 15000,
    deficitTCO2e: 2330,
    taxRatePerTonIDR: 30000,
    totalTaxPayableIDR: 69900000,
    governingRegulation: 'UU No. 7/2021 (HPP) & Permen LHK 21/2022',
    calculatedAt: '2026-02-14T08:00:00.000Z',
  };

  const mockStpDoc = {
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    stpDocNumber: 'STP-DJP-2026-98124',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
    companyName: 'PT Semen Gresik Pabrik Tuban',
    npwp: '01.234.567.8-012.000',
    taxYear: 2026,
    totalTaxDueIDR: 69900000,
    dueDate: '2026-12-31',
    paymentStatus: 'unpaid' as const,
    issuedAt: '2026-02-14T08:00:00.000Z',
  };

  const mockDjpService = {
    calculateTax: jest.fn().mockResolvedValue(mockCalculation),
    issueStp: jest.fn().mockResolvedValue(mockStpDoc),
    getTaxHistory: jest.fn().mockResolvedValue([mockStpDoc]),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [DjpController],
      providers: [
        {
          provide: DjpService,
          useValue: mockDjpService,
        },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('POST /integrations/djp/calculate-tax returns CarbonTaxCalculationSchema', async () => {
    const payload = {
      companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
      actualEmissionTCO2e: 17330,
      quotaPTBAETCO2e: 15000,
      taxRatePerTonIDR: 30000,
    };
    const res = await harness.http
      .post('/integrations/djp/calculate-tax')
      .send(payload)
      .expect(201);

    const result = expectContract(res.body, CarbonTaxCalculationSchema);
    expect(result.companyId).toBe(payload.companyId);
    expect(result.deficitTCO2e).toBe(2330);
    expect(result.totalTaxPayableIDR).toBe(69900000);
  });

  it('POST /integrations/djp/issue-stp issues official invoice matching StpDocumentSchema', async () => {
    const payload = {
      companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
      taxYear: 2026,
      totalTaxDueIDR: 69900000,
    };
    const res = await harness.http
      .post('/integrations/djp/issue-stp')
      .send(payload)
      .expect(201);

    const result = expectContract(res.body, StpDocumentSchema);
    expect(result.stpDocNumber).toBe('STP-DJP-2026-98124');
    expect(result.paymentStatus).toBe('unpaid');
  });

  it('GET /integrations/djp/tax-history/:companyId returns StpDocumentSchema array', async () => {
    const res = await harness.http
      .get(`/integrations/djp/tax-history/${mockCalculation.companyId}`)
      .expect(200);

    const list = expectContract(res.body, z.array(StpDocumentSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].companyId).toBe(mockCalculation.companyId);
  });
});
