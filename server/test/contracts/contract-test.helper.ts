import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { TransformInterceptor, HttpExceptionFilter } from '../../src/common';
import { type ZodType } from 'zod';
import { ProjectsService } from '../../src/projects/projects.service';
import { CompaniesService } from '../../src/companies/companies.service';
import { BursaService } from '../../src/bursa/bursa.service';
import { ComplianceService } from '../../src/compliance/compliance.service';
import { JwtService } from '@nestjs/jwt';

// Static fixtures conforming to domain contracts for fast, deterministic in-memory tests
export const FIXTURE_PROJECT = {
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

export const FIXTURE_COMPANY = {
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

export const FIXTURE_BURSA_ITEM = {
  id: 'b1c2d3e4-0001-4000-8000-000000000001',
  name: 'Restorasi Mangrove Teluk Benoa',
  verified: true,
  category: 'mangrove' as const,
  categoryLabel: 'Mangrove & Coastal Blue Carbon',
  location: 'Bali',
  pricePerTonIDR: 260000,
  change24h: 3.8,
  volumeAvailableTCO2e: 4500,
  supplyPercent: 78.5,
};

export const FIXTURE_COMPLIANCE_DATA = {
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
};

export async function createContractTestApp(): Promise<{
  app: INestApplication;
  testJwtToken: string;
}> {
  const jwtSecret = process.env.JWT_SECRET || 'secretKey';
  const jwtService = new JwtService({ secret: jwtSecret });
  const testJwtToken = jwtService.sign({
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'admin@rekakarbon.id',
    role: 'superadmin',
  });

  const builder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Provide deterministic fixture-backed service mocks for in-memory execution
  builder.overrideProvider(ProjectsService).useValue({
    findProjects: jest.fn().mockResolvedValue([FIXTURE_PROJECT]),
    findProjectById: jest.fn().mockImplementation((id: string) => {
      if (id === FIXTURE_PROJECT.id) return Promise.resolve(FIXTURE_PROJECT);
      return Promise.resolve(null);
    }),
  });

  builder.overrideProvider(CompaniesService).useValue({
    findAll: jest.fn().mockResolvedValue([FIXTURE_COMPANY]),
    findById: jest.fn().mockImplementation((id: string) => {
      if (id === FIXTURE_COMPANY.id) return Promise.resolve(FIXTURE_COMPANY);
      return Promise.resolve(null);
    }),
  });

  builder.overrideProvider(BursaService).useValue({
    getBursaItems: jest.fn().mockResolvedValue([FIXTURE_BURSA_ITEM]),
    getPurchaseEligibility: jest.fn().mockResolvedValue({
      canPurchase: true,
      reason: 'eligible',
      message: 'Perusahaan berhak melakukan pembelian kredit karbon.',
      complianceYear: 2026,
      reportId: 'c1e2f3a4-0001-4000-8000-000000000001',
      reportStatus: 'verified',
      approvedEmissionsTCO2e: 17330,
      ptbaeQuotaTCO2e: 15000,
      retiredTCO2e: 0,
      availableTokenBalanceTCO2e: 0,
      complianceDeficitTCO2e: 2330,
      purchaseRequirementTCO2e: 2330,
    }),
  });

  builder.overrideProvider(ComplianceService).useValue({
    getComplianceData: jest.fn().mockResolvedValue(FIXTURE_COMPLIANCE_DATA),
  });

  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();

  return { app, testJwtToken };
}

/**
 * Asserts that the response follows the standard ApiResponse envelope { success: true, data: T }
 * and that the data payload strictly adheres to the provided Zod schema.
 */
export function expectContract<T>(
  responseBody: unknown,
  schema: ZodType<T>,
): T {
  if (
    !responseBody ||
    typeof responseBody !== 'object' ||
    !('success' in responseBody) ||
    !('data' in responseBody)
  ) {
    throw new Error(
      `Response does not match standard { success: true, data: T } envelope:\n${JSON.stringify(responseBody, null, 2)}`,
    );
  }

  const envelope = responseBody as { success: boolean; data: unknown };
  if (envelope.success !== true) {
    throw new Error(
      `Response reported failure (success !== true):\n${JSON.stringify(responseBody, null, 2)}`,
    );
  }

  const parseResult = schema.safeParse(envelope.data);
  if (!parseResult.success) {
    const issues = parseResult.error.issues;
    const formatted = issues
      .map(
        (i) =>
          `  - [${i.path.join('.') || 'root'}]: ${i.message} (received: ${JSON.stringify((i as unknown as { received?: unknown }).received)})`,
      )
      .join('\n');
    throw new Error(
      `API Contract Validation Failed! Client Zod Schema rejected backend response:\n${formatted}\n\nPayload:\n${JSON.stringify(envelope.data, null, 2)}`,
    );
  }

  return parseResult.data;
}
