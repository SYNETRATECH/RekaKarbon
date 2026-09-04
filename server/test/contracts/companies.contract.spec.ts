import { CompaniesController } from '../../src/companies/companies.controller';
import { CompaniesService } from '../../src/companies/companies.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
  getResponseError,
} from '../../src/common/testing/contract-test-harness';
import { CompanySchema } from '../../../client/src/schemas';
import { z } from 'zod';

describe('Companies API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockCompany = {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'PT Semen Gresik Pabrik Tuban',
    sector: 'Semen & Manufaktur Berat',
    region: 'Jawa Timur',
    center: [-6.8947, 112.0454] as [number, number],
    zoom: 13,
    emissionCap: 15000,
    actualEmission: 17330,
    carbonDeficit: 2330,
    paymentStatus: 'unpaid' as const,
    offsetCostIDR: 605800000,
    auditDate: '2026-02-14',
    paymentDeadline: '2026-03-31',
    stackSensors: '4 Cerobong (Continuous Emission Monitoring System)',
    complianceRating: 'warning' as const,
    recommendedPartner: 'Dinas Kehutanan Jatim',
    picAuditor: 'Budi Santoso, S.T., M.Env',
    description: 'Fasilitas produksi klinker semen.',
  };

  const mockCompaniesService = {
    findAll: jest.fn().mockResolvedValue([mockCompany]),
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === mockCompany.id) return Promise.resolve(mockCompany);
      return Promise.resolve(null);
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [CompaniesController],
      providers: [
        { provide: CompaniesService, useValue: mockCompaniesService },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /companies returns array of companies matching CompanySchema', async () => {
    const res = await harness.http.get('/companies').expect(200);
    const list = expectContract(res.body, z.array(CompanySchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockCompany.id);
    expect(list[0].complianceRating).toBe('warning');
  });

  it('GET /companies/:id returns single company matching CompanySchema', async () => {
    const res = await harness.http
      .get(`/companies/${mockCompany.id}`)
      .expect(200);
    const item = expectContract(res.body, CompanySchema);
    expect(item.id).toBe(mockCompany.id);
    expect(item.name).toBe(mockCompany.name);
  });

  it('GET /companies/:id with non-existent id returns 404 ApiErrorResponse', async () => {
    const res = await harness.http
      .get('/companies/a1b2c3d4-0001-4000-8000-000000000999')
      .expect(404);

    const err = getResponseError(res);
    expect(err.success).toBe(false);
    expect(err.error.code).toBe('COMPANY_NOT_FOUND');
  });
});
