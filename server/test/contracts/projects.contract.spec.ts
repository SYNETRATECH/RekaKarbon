import { ProjectsController } from '../../src/projects/projects.controller';
import { RegulatorProjectsController } from '../../src/projects/regulator-projects.controller';
import { ProjectsService } from '../../src/projects/projects.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
  getResponseError,
} from '../../src/common/testing/contract-test-harness';
import {
  ProjectSchema,
  NationalForestRegionSchema,
  ForestProjectApiItemSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('Projects API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockProject = {
    id: 'b2c3d4e5-0002-4000-8000-000000000001',
    name: 'TN Baluran Restorasi',
    region: 'Jawa Timur',
    center: [-7.8385, 114.3725] as [number, number],
    zoom: 12,
    area: 25000,
    rawAreaVal: 25000,
    carbon: 1240000,
    rawCarbonVal: 1240000,
    ndvi: 0.78,
    evi: 0.61,
    coordinates: [
      { lat: -7.732, lng: 114.398 },
      { lat: -7.735, lng: 114.471 },
    ],
    trendLabels: ['2021', '2022', '2023', '2024', '2025'],
    trendData: [1.15, 1.18, 1.2, 1.22, 1.24],
    survivalRate: 0.875,
    canopyHeight: 1.85,
    bufferAllocated: 0.08,
    bufferUsed: 0.0,
    reforestationStatus: 'Sangat Baik',
    reforestationPartner: 'Dinas Kehutanan Jawa Timur & Balai TN Baluran',
    reforestationSite: 'Lahan Uji Coba Cangar, Malang',
    targetTrees: 200000,
    plantedTrees: 174000,
    remainingTrees: 26000,
    carbonPricePerTon: 260000,
    totalBudget: 4850000000,
    disbursedBudget: 3750000000,
    remainingBudget: 1100000000,
    currentYear: 4,
    stages: [
      {
        year: 1,
        title: 'Tahun 1: Pembibitan',
        milestone: 'Pengadaan bibit',
        status: 'completed' as const,
        canopyDensity: 28,
        gsd: 2.5,
        kthName: 'KTH Bina Wana Baluran',
        farmerIncentive: 120000000,
        incentiveStatus: 'Telah Disalurkan',
        speCreditMinted: 800,
        speStatus: 'Terbit (Minted)',
        targetTrees: 50000,
        plantedTrees: 50000,
        remainingTrees: 0,
      },
    ],
    disbursementHistory: [
      {
        id: 'd1e2f3a4-0001-4000-8000-000000000001',
        date: '2026-02-14',
        amount: 150000000,
        category: 'Restorasi & Pemeliharaan',
        desc: 'Insentif KTH',
        txHash:
          '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
        blockNumber: '#184920',
        vendor: 'KTH Baluran',
        items: [
          {
            name: 'Bibit Mangrove',
            qty: 500,
            unit: 'Pohon',
            price: 100000,
            total: 50000000,
          },
        ],
        proofImages: ['https://example.com/proof1.jpg'],
      },
    ],
    tokenBuyers: [
      {
        id: 't1e2f3a4-0001-4000-8000-000000000001',
        companyId: 'c1e2f3a4-0001-4000-8000-000000000001',
        companyName: 'PT Semen Indonesia (Persero) Tbk',
        sector: 'Manufaktur & Semen',
        tCO2e: 1200,
        amountIDR: 312000000,
        pricePerTon: 260000,
        purchaseDate: '2026-02-14',
        speCertificateId: 'SPE-BALURAN-2025-001',
        txHash:
          '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        blockNumber: '#184410',
        verificationStatus: 'Terverifikasi (KLHK On-Chain)',
        auditor: 'Sucofindo',
      },
    ],
  };

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

  const mockProjectsService = {
    findProjects: jest.fn().mockResolvedValue([mockProject]),
    findProjectById: jest.fn().mockImplementation((id: string) => {
      if (id === mockProject.id) return Promise.resolve(mockProject);
      return Promise.resolve(null);
    }),
    findNationalForestRegions: jest.fn().mockResolvedValue([mockForestRegion]),
    findForestProjects: jest.fn().mockResolvedValue([mockForestProjectItem]),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [ProjectsController, RegulatorProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  describe('GET /projects', () => {
    it('returns array of projects adhering to client ProjectSchema', async () => {
      const res = await harness.http.get('/projects').expect(200);
      const list = expectContract(res.body, z.array(ProjectSchema));
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].id).toBe(mockProject.id);
      expect(list[0].center).toEqual([-7.8385, 114.3725]);
    });
  });

  describe('GET /projects/:id', () => {
    it('returns single project adhering to ProjectSchema', async () => {
      const res = await harness.http
        .get(`/projects/${mockProject.id}`)
        .expect(200);
      const item = expectContract(res.body, ProjectSchema);
      expect(item.id).toBe(mockProject.id);
      expect(item.name).toBe(mockProject.name);
    });

    it('rejects invalid UUID string with 400 Bad Request via ParseUUIDPipe', async () => {
      const res = await harness.http.get('/projects/invalid-id').expect(400);
      const err = getResponseError(res);
      expect(err.success).toBe(false);
    });
  });

  describe('GET /regulator/forest-regions', () => {
    it('returns national forest regions matching NationalForestRegionSchema', async () => {
      const res = await harness.http
        .get('/regulator/forest-regions')
        .expect(200);
      const list = expectContract(
        res.body,
        z.array(NationalForestRegionSchema),
      );
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].regionName).toBe('Jawa Timur');
    });
  });

  describe('GET /regulator/forest-projects', () => {
    it('returns forest project items matching ForestProjectApiItemSchema', async () => {
      const res = await harness.http
        .get('/regulator/forest-projects')
        .expect(200);
      const list = expectContract(
        res.body,
        z.array(ForestProjectApiItemSchema),
      );
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].projectName).toBe('TN Baluran Restorasi');
      expect(list[0].auditStatus).toBe('verified');
    });
  });
});
