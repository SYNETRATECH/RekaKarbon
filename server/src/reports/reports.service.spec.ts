import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { StorageService } from '../storage/storage.service';
import { PtbaeService } from '../compliance/ptbae.service';
import { CalculationService } from './calculation.service';
import { MlAuditEngineService } from '../audit/ml-audit-engine.service';
import {
  SCENARIO_1_COMPLIANT_MANUFACTURING,
  SCENARIO_2_STOICHIOMETRIC_UNDERREPORTING,
  SCENARIO_4_CEMENT_PROCESS_OMISSION,
} from '../../test/fixtures/ml-report-scenarios.fixture';

describe('ReportsService - ML Anomaly Detection Integration', () => {
  let service: ReportsService;
  let mlEngine: MlAuditEngineService;
  let prismaMock: any;
  let blockchainMock: any;
  let ptbaeMock: any;

  const mockUser = {
    id: 'usr-emitter-001',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    companies: [
      {
        id: 'comp-001',
        name: 'PT Semen Nusatama Tbk',
        productionCapacityTonnes: 500000,
      },
    ],
  };

  beforeAll(async () => {
    // Initialise real ML engine with ONNX session
    mlEngine = new MlAuditEngineService();
    await mlEngine.initOnnxSession();
  });

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      company: {
        findUnique: jest.fn().mockResolvedValue(mockUser.companies[0]),
        update: jest.fn().mockResolvedValue(mockUser.companies[0]),
      },
      emissionReport: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'rep-created-123',
            ...data,
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'rep-updated-123',
            ...data,
          }),
        ),
      },
      emissionReportAuditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-001' }),
      },
      auditAnomaly: {
        create: jest.fn().mockResolvedValue({ id: 'anom-001' }),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          async (callback: (tx: typeof prismaMock) => Promise<unknown>) => {
            return await callback(prismaMock);
          },
        ),
    };

    blockchainMock = {
      submitEmissionReport: jest.fn().mockResolvedValue({
        txHash:
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        reportId: 42,
      }),
    };

    ptbaeMock = {
      resolveForCompany: jest.fn().mockResolvedValue({
        quotaTCO2e: 50000,
        allocation: null,
      }),
      updateCompanyComplianceStatus: jest.fn().mockResolvedValue(undefined),
      calculateDeficit: jest.fn().mockImplementation((actual, quota) => {
        if (quota === null || quota === undefined) return null;
        return actual - quota;
      }),
    };

    const storageMock = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        CalculationService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BlockchainService, useValue: blockchainMock },
        { provide: StorageService, useValue: storageMock },
        { provide: PtbaeService, useValue: ptbaeMock },
        { provide: MlAuditEngineService, useValue: mlEngine },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Scenario 1: Compliant Manufacturing Emission Report', () => {
    it('should evaluate compliant report as PASS_VERIFIED with high trust score and no anomalies persisted', async () => {
      mockUser.companies[0].productionCapacityTonnes = 600;
      const scenario = SCENARIO_1_COMPLIANT_MANUFACTURING;

      const result = await service.submitCalculatorReport(
        mockUser.id,
        scenario.year,
        scenario.sector,
        scenario.totalEmissions,
        scenario.calculationData,
      );

      expect(result).toBeDefined();
      expect(result.blockchainReportId).toBe(42);
      expect(result.merkleRoot).toBeDefined();
      expect(result.txHash).toBeDefined();

      const audit = result.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(false);
      expect(audit?.verdict).toBe('PASS_VERIFIED');
      expect(audit?.trustScore).toBeGreaterThanOrEqual(80.0);
      expect(audit?.flags).toEqual([]);
      expect(audit?.xai).toBeDefined();
      expect(audit?.xai?.shapAttributions?.length).toBeGreaterThan(0);

      // No AuditAnomaly persisted in database
      expect(prismaMock.auditAnomaly.create).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 2: Stoichiometric Under-reporting Mismatch', () => {
    it('should flag severe under-reporting as REJECT_ANOMALY and auto-persist AuditAnomaly in DB', async () => {
      const scenario = SCENARIO_2_STOICHIOMETRIC_UNDERREPORTING;

      const result = await service.submitCalculatorReport(
        mockUser.id,
        scenario.year,
        scenario.sector,
        scenario.totalEmissions,
        scenario.calculationData,
      );

      expect(result).toBeDefined();
      const audit = result.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(true);
      expect(audit?.verdict).toBe('REJECT_ANOMALY');
      expect(audit?.divergencePercent).toBeGreaterThan(45.0);
      expect(audit?.flags).toContain('UNDER_REPORTING_TERINDIKASI');
      expect(audit?.flags).toContain('DEVIASI_FISIK_DAN_LAPORAN_TINGGI');

      // Anomaly auto-persisted in PostgreSQL via Prisma
      expect(prismaMock.auditAnomaly.create).toHaveBeenCalledTimes(1);
      const persistedCall = prismaMock.auditAnomaly.create.mock.calls[0][0];
      expect(persistedCall.data.companyId).toBe('comp-001');
      expect(persistedCall.data.anomalyType).toBe('CEMS_ENERGY_CORRELATION');
    });
  });

  describe('Scenario 4: Cement Clinker Process Omission', () => {
    it('should detect cement plant without clinker calcination emissions and flag anomaly', async () => {
      mockUser.companies[0].productionCapacityTonnes = 15000;
      const scenario = SCENARIO_4_CEMENT_PROCESS_OMISSION;

      const result = await service.submitCalculatorReport(
        mockUser.id,
        scenario.year,
        scenario.sector,
        scenario.totalEmissions,
        scenario.calculationData,
      );

      expect(result).toBeDefined();
      const audit = result.auditResult;
      expect(audit).toBeDefined();
      expect(audit?.isAnomaly).toBe(true);
      expect(audit?.verdict).toBe('REJECT_ANOMALY');
      expect(audit?.flags).toContain('EMISI_PROSES_TIDAK_DILAPORKAN');
      expect(prismaMock.auditAnomaly.create).toHaveBeenCalledTimes(1);
    });
  });
});
