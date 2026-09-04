import { PtbaeController } from '../../src/ptbae/ptbae.controller';
import { PtbaeAuditController } from '../../src/ptbae/ptbae-audit.controller';
import { PtbaeMinistryController } from '../../src/ptbae/ptbae-ministry.controller';
import { PtbaeService } from '../../src/ptbae/ptbae.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import { PtbaeApplicationSchema } from '../../../client/src/schemas';
import { z } from 'zod';

describe('PTBAE Applications API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockApplication = {
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
    companyName: 'PT Semen Gresik Pabrik Tuban',
    emissionReportId: null,
    complianceYear: 2026,
    status: 'draft' as const,
    facilityName: 'Kiln Plant Tuban Unit 4',
    technicalData: {
      machineryDescription: 'Rotary Kiln 4-Stage Preheater',
      fuelTypes: ['Coal', 'Biomass Alternative Fuel'],
      installedCapacityMW: 45.5,
      energyEfficiencyPercent: 82.5,
      mitigationTechnology: 'Waste Heat Recovery Power Generation (WHRPG)',
    },
    productionData: {
      plannedVolumeTons: 500000,
      actualVolumeTons: 0,
      productUnit: 'Ton Klinker',
    },
    baselineEmissionTCO2e: 15000,
    mitigationPlan: 'Pemanfaatan sekam padi dan RDF limbah padat kota.',
    emitterNotes: 'Pengajuan kuota PTBAE-PU awal periode 2026.',
    submittedAt: null,
    auditedAt: null,
    auditorNotes: null,
    ministryDecidedAt: null,
    ministryNotes: null,
    currentVersion: 1,
    latestMerkleRoot: null,
    latestAnchorStatus: null,
    latestAnchoredAt: null,
    integrity: null,
    allocation: null,
    documents: [],
    createdAt: '2026-02-14T08:00:00.000Z',
    updatedAt: '2026-02-14T08:00:00.000Z',
  };

  const mockPtbaeService = {
    getEmitterApplications: jest.fn().mockResolvedValue([mockApplication]),
    createOrUpdateEmitterApplication: jest
      .fn()
      .mockResolvedValue(mockApplication),
    getAuditQueue: jest.fn().mockResolvedValue([mockApplication]),
    getAuditApplication: jest.fn().mockResolvedValue(mockApplication),
    recordAuditorDecision: jest.fn().mockResolvedValue({
      ...mockApplication,
      status: 'ministry_review',
    }),
    getMinistryQueue: jest.fn().mockResolvedValue([mockApplication]),
    getMinistryApplication: jest.fn().mockResolvedValue(mockApplication),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [
        PtbaeController,
        PtbaeAuditController,
        PtbaeMinistryController,
      ],
      providers: [
        {
          provide: PtbaeService,
          useValue: mockPtbaeService,
        },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /ptbae-applications/mine returns array adhering to PtbaeApplicationSchema', async () => {
    const res = await harness.http.get('/ptbae-applications/mine').expect(200);
    const list = expectContract(res.body, z.array(PtbaeApplicationSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockApplication.id);
    expect(list[0].facilityName).toBe('Kiln Plant Tuban Unit 4');
  });

  it('GET /audit/ptbae-applications returns queue adhering to PtbaeApplicationSchema', async () => {
    const res = await harness.http.get('/audit/ptbae-applications').expect(200);
    const list = expectContract(res.body, z.array(PtbaeApplicationSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockApplication.id);
  });

  it('GET /audit/ptbae-applications/:id returns single PtbaeApplicationSchema item', async () => {
    const res = await harness.http
      .get(`/audit/ptbae-applications/${mockApplication.id}`)
      .expect(200);
    const item = expectContract(res.body, PtbaeApplicationSchema);
    expect(item.id).toBe(mockApplication.id);
  });

  it('GET /ministry/ptbae-applications returns ministry queue adhering to PtbaeApplicationSchema', async () => {
    const res = await harness.http
      .get('/ministry/ptbae-applications')
      .expect(200);
    const list = expectContract(res.body, z.array(PtbaeApplicationSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockApplication.id);
  });
});
