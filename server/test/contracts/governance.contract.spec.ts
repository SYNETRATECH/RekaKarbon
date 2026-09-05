import { GovernanceController } from '../../src/governance/governance.controller';
import { GovernanceService } from '../../src/governance/governance.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  MultiSigRequestSchema,
  KybQueueItemSchema,
  DjpLogItemSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';
import {
  createMockMultiSigRequest,
  createMockKybQueueItem,
  createMockDjpLogItem,
} from '../factories';

describe('Governance API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockMultiSigItem = createMockMultiSigRequest({
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    txType: 'Pencairan Dana Tahap 2 Restorasi Baluran',
    applicant: 'Admin Operasional',
    amountIDR: 150000000,
    volumeTCO2e: 500,
    signersCount: 2,
    requiredSigners: 3,
    status: 'pending' as const,
    date: '2026-02-14',
  });

  const mockKybItem = createMockKybQueueItem({
    id: 'b2c3d4e5-0002-4000-8000-000000000002',
    entityName: 'PT Semen Gresik Pabrik Tuban',
    category: 'corporate' as const,
    submissionDate: '2026-02-10',
    documentsCount: 4,
    verificationStatus: 'verified' as const,
    assignedVerifier: 'Auditor KLHK',
  });

  const mockDjpItem = createMockDjpLogItem({
    id: 'b2c3d4e5-0003-4000-8000-000000000003',
    timestamp: '2026-02-14T08:00:00.000Z',
    taxPayerName: 'PT Semen Gresik Pabrik Tuban',
    npwp: '01.234.567.8-012.000',
    stpDocId: 'STP-DJP-2026-001',
    carbonTaxCalculatedIDR: 69900000,
    status: 'synced' as const,
  });

  const mockGovernanceService = {
    getMultiSigRequests: jest.fn().mockResolvedValue([mockMultiSigItem]),
    getKybQueue: jest.fn().mockResolvedValue([mockKybItem]),
    getDjpLogs: jest.fn().mockResolvedValue([mockDjpItem]),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [GovernanceController],
      providers: [
        {
          provide: GovernanceService,
          useValue: mockGovernanceService,
        },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /governance/multi-sig returns items matching MultiSigRequestSchema', async () => {
    const res = await harness.http.get('/governance/multi-sig').expect(200);
    const list = expectContract(res.body, z.array(MultiSigRequestSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockMultiSigItem.id);
    expect(list[0].status).toBe('pending');
  });

  it('GET /governance/kyb returns items matching KybQueueItemSchema', async () => {
    const res = await harness.http.get('/governance/kyb').expect(200);
    const list = expectContract(res.body, z.array(KybQueueItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockKybItem.id);
    expect(list[0].category).toBe('corporate');
  });

  it('GET /governance/djp-logs returns items matching DjpLogItemSchema', async () => {
    const res = await harness.http.get('/governance/djp-logs').expect(200);
    const list = expectContract(res.body, z.array(DjpLogItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockDjpItem.id);
    expect(list[0].npwp).toBe('01.234.567.8-012.000');
  });
});
