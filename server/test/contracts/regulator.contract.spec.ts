import { RegulatorController } from '../../src/regulator/regulator.controller';
import { RegulatorService } from '../../src/regulator/regulator.service';
import { PtbaeService } from '../../src/compliance/ptbae.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  NationalForestRegionSchema,
  ForestProjectApiItemSchema,
  KTHGroupItemSchema,
  KTHTransactionItemSchema,
  RegulationDocumentUploadItemSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('Regulator API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockForestRegion = {
    id: 'b2c3d4e5-0001-4000-8000-000000000001',
    regionName: 'Jawa Timur',
    areaHectares: 25000,
    carbonSequestrationTCO2e: 1240000,
    fundingDisbursedIDR: 3750000000,
    forestHealthPercent: 95.0,
  };

  const mockForestProjectItem = {
    id: 'b2c3d4e5-0002-4000-8000-000000000001',
    projectName: 'TN Baluran Restorasi',
    region: 'Jawa Timur',
    ecosystemType: 'tropical rainforest',
    coordinates: [-7.8385, 114.3725] as [number, number],
    areaHectares: 25000,
    targetSequestrationTCO2e: 1240000,
    actualSequestrationTCO2e: 1240000,
    carbonStockTCO2e: 1240000,
    fundingBudgetIDR: 4850000000,
    fundingDisbursedIDR: 3750000000,
    partnerKTH: 'KTH Bina Wana Baluran',
    kthLeader: 'Pak Hadi',
    kthMembersCount: 42,
    auditStatus: 'verified' as const,
    droneAuditCount: 4,
    lastDroneAuditDate: '2026-02-10',
    speCertificateId: 'SPE-BALURAN-2025-001',
    ndviScore: 0.78,
    eviScore: 0.61,
    progressDetail: {
      survivalRatePercent: 87.5,
      canopyHeightMeters: 1.85,
      bufferAllocatedPercent: 8,
      bufferUsedPercent: 0,
      reforestationStatusText: 'Sangat Baik',
      reforestationPartner: 'Dinas Kehutanan Jatim',
      reforestationSite: 'Cangar',
      targetTrees: 200000,
      plantedTrees: 174000,
      remainingTrees: 26000,
      carbonPricePerTonIDR: 260000,
      totalBudgetIDR: 4850000000,
      disbursedBudgetIDR: 3750000000,
      remainingBudgetIDR: 1100000000,
      currentYear: 4,
      stages: [],
      disbursements: [],
      tokenBuyers: [],
    },
  };

  const mockKthGroup = {
    id: 'b2c3d4e5-0003-4000-8000-000000000001',
    groupName: 'KTH Mangrove Tuban Mandiri',
    leaderName: 'H. Sudirman',
    memberCount: 38,
    location: 'Kabupaten Tuban',
    kybStatus: 'verified' as const,
    registrationNumber: 'SK.LHK-8832/KTH/2023',
    totalIncentiveReceivedIDR: 340000000,
    walletAddress: '0x8a1c948571029485710294857102948571029485',
  };

  const mockKthTransaction = {
    id: 'b2c3d4e5-0004-4000-8000-000000000001',
    txHash:
      '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    date: '2026-02-14T08:00:00.000Z',
    kthName: 'KTH Mangrove Tuban Mandiri',
    projectName: 'Restorasi Mangrove Hutan Lindung Tuban',
    volumeTCO2e: 450,
    amountIDR: 117000000,
    status: 'completed' as const,
  };

  const mockRegulationUpload = {
    id: 'b2c3d4e5-0005-4000-8000-000000000001',
    documentTitle: 'SK Alokasi PTBAE PU Semen Gresik 2026',
    category: 'sk_ptbae' as const,
    categoryLabel: 'SK Penetapan PTBAE',
    agencyIssuer: 'KLHK & DJP' as const,
    fileName: 'SK_Alokasi_PTBAE_PU_Semen_Gresik_2026.pdf',
    fileSize: 2450000,
    uploadDate: '2026-02-14T08:00:00.000Z',
    signatoryPerson: 'Direktorat Jenderal PPI KLHK',
    targetEntityName: 'PT Semen Gresik Pabrik Tuban',
    status: 'published' as const,
  };

  const mockRegulatorService = {
    getNationalForestRegions: jest.fn().mockResolvedValue([mockForestRegion]),
    getForestProjects: jest.fn().mockResolvedValue([mockForestProjectItem]),
    getKTHGroups: jest.fn().mockResolvedValue([mockKthGroup]),
    getKTHTransactions: jest.fn().mockResolvedValue([mockKthTransaction]),
    getRegulationUploads: jest.fn().mockResolvedValue([mockRegulationUpload]),
  };

  const mockPtbaeService = {
    upsertAllocation: jest.fn().mockResolvedValue({
      id: 'b2c3d4e5-0006-4000-8000-000000000001',
      companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
      complianceYear: 2026,
      quotaPtbaeTco2e: 15000,
      status: 'SUBMITTED',
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [RegulatorController],
      providers: [
        { provide: RegulatorService, useValue: mockRegulatorService },
        { provide: PtbaeService, useValue: mockPtbaeService },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /regulator/forest-regions returns NationalForestRegionSchema array', async () => {
    const res = await harness.http.get('/regulator/forest-regions').expect(200);
    const list = expectContract(res.body, z.array(NationalForestRegionSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockForestRegion.id);
  });

  it('GET /regulator/forest-projects returns ForestProjectApiItemSchema array', async () => {
    const res = await harness.http
      .get('/regulator/forest-projects')
      .expect(200);
    const list = expectContract(res.body, z.array(ForestProjectApiItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].projectName).toBe('TN Baluran Restorasi');
  });

  it('GET /regulator/kth-groups returns KTHGroupItemSchema array', async () => {
    const res = await harness.http.get('/regulator/kth-groups').expect(200);
    const list = expectContract(res.body, z.array(KTHGroupItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].groupName).toBe('KTH Mangrove Tuban Mandiri');
    expect(list[0].kybStatus).toBe('verified');
  });

  it('GET /regulator/kth-transactions returns KTHTransactionItemSchema array', async () => {
    const res = await harness.http
      .get('/regulator/kth-transactions')
      .expect(200);
    const list = expectContract(res.body, z.array(KTHTransactionItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].kthName).toBe('KTH Mangrove Tuban Mandiri');
    expect(list[0].volumeTCO2e).toBe(450);
  });

  it('GET /regulator/regulation-uploads returns RegulationDocumentUploadItemSchema array', async () => {
    const res = await harness.http
      .get('/regulator/regulation-uploads')
      .expect(200);
    const list = expectContract(
      res.body,
      z.array(RegulationDocumentUploadItemSchema),
    );
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].category).toBe('sk_ptbae');
    expect(list[0].agencyIssuer).toBe('KLHK & DJP');
  });

  it('POST /regulator/ptbae-allocations saves allocation and handles validation', async () => {
    const payload = {
      companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
      complianceYear: 2026,
      quotaTCO2e: 15000,
      sourceDocument: 'SK_PTBAE_PU_SEMEN_GRESIK_2026.pdf',
      status: 'PENDING',
    };
    const res = await harness.http
      .post('/regulator/ptbae-allocations')
      .send(payload)
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.quotaPtbaeTco2e).toBe(15000);
  });
});
