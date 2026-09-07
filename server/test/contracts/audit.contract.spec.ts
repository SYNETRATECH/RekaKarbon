import { AuditController } from '../../src/audit/audit.controller';
import { AuditService } from '../../src/audit/audit.service';
import { MlAuditEngineService } from '../../src/audit/ml-audit-engine.service';
import { EmissionReportAuditService } from '../../src/audit/emission-report-audit.service';
import { MlRetrainingService } from '../../src/audit/ml-retraining.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  AiAnomalyLogSchema,
  AnomalySummarySchema,
  EnergyCorrelationItemSchema,
  SpatialSummarySchema,
} from '../../../client/src/schemas';
import { z } from 'zod';
import {
  createMockAnomalyLog,
  createMockAnomalySummary,
  createMockSpatialSummary,
} from '../factories';

describe('Audit & dMRV API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockAnomalyLog = createMockAnomalyLog({
    id: 'a1e2f3a4-0001-4000-8000-000000000001',
    company: 'PT Semen Gresik',
    sector: 'Manufaktur Berat',
    anomalyScore: 84.5,
    deltaElectricity: 14.2,
    deltaCoal: 28.5,
    deltaGas: -5.0,
    eFakturMatch: false,
    priority: 'high' as const,
    reportedEmission: 15000,
    estimatedEmission: 19200,
    desc: 'Deviasi konsumsi batu bara terdeteksi',
    auditStatus: 'pending' as const,
  });

  const mockAnomalySummary = createMockAnomalySummary({
    emitenTerdeteksiAnomali: 3,
    totalEmitenAktif: 24,
    rataDeviasiEmisi: 18.4,
    descDeviasi: 'Rata-rata selisih laporan CEMS vs e-Faktur',
    eFakturTidakCocok: 2,
    descEFaktur: 'Faktur PPN batu bara tidak sinkron',
  });

  const mockEnergyCorrelation = [
    {
      name: 'PT Semen Gresik',
      reported: 15000,
      estimated: 19200,
    },
  ];

  const mockSpatialSummary = createMockSpatialSummary({
    totalAreaTerverifikasi: '124.500 Ha',
    subArea: 'Total wilayah hutan restorasi',
    totalKreditKarbon: '4.250.000 tCO2e',
    subKredit: 'Estimasi biomassa dMRV',
    blokadeAwan: '2.4%',
    subAwan: 'Tutupan awan satelit Sentinel-2',
    areaHectares: 124500,
    totalTreeCount: 1420000,
    avgCanopyDensity: 82.5,
    estimatedBiomassTCO2e: 4250000,
    droneAuditCoveragePercent: 94.0,
    lastAuditDate: '2026-02-14',
  });

  const mockAuditService = {
    getAiAnomalyLogs: jest.fn().mockResolvedValue([mockAnomalyLog]),
    getAnomalySummary: jest.fn().mockResolvedValue(mockAnomalySummary),
    getEnergyCorrelation: jest.fn().mockResolvedValue(mockEnergyCorrelation),
    getSpatialSummary: jest.fn().mockResolvedValue(mockSpatialSummary),
    getConservationAreas: jest.fn().mockResolvedValue([]),
    getDroneArchive: jest.fn().mockResolvedValue([]),
    getDroneSchedules: jest.fn().mockResolvedValue([]),
    getCertificationPreview: jest.fn().mockResolvedValue({}),
    getDroneScans: jest.fn().mockResolvedValue([]),
    getKthPolygons: jest.fn().mockResolvedValue([]),
    getKthLogs: jest.fn().mockResolvedValue([]),
    verifyAnomalyRecord: jest.fn().mockResolvedValue({ verified: true }),
    authorizeMintingCredit: jest.fn().mockResolvedValue({ authorized: true }),
  };

  const mockMlAuditEngineService = {
    isModelLoaded: jest.fn().mockReturnValue(true),
    getModelPath: jest.fn().mockReturnValue('/models/audit_engine.onnx'),
    evaluateEmissionReport: jest.fn().mockResolvedValue({ passed: true }),
  };

  const mockEmissionReportAuditService = {
    getQueue: jest.fn().mockResolvedValue([]),
    getDetail: jest.fn().mockResolvedValue({}),
    decide: jest.fn().mockResolvedValue({ status: 'approved' }),
  };

  const mockMlRetrainingService = {
    getStatus: jest.fn().mockResolvedValue({}),
    triggerRetraining: jest.fn().mockResolvedValue({}),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [AuditController],
      providers: [
        { provide: AuditService, useValue: mockAuditService },
        { provide: MlAuditEngineService, useValue: mockMlAuditEngineService },
        {
          provide: EmissionReportAuditService,
          useValue: mockEmissionReportAuditService,
        },
        {
          provide: MlRetrainingService,
          useValue: mockMlRetrainingService,
        },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /audit/anomaly-logs returns logs matching AiAnomalyLogSchema', async () => {
    const res = await harness.http.get('/audit/anomaly-logs').expect(200);
    const logs = expectContract(res.body, z.array(AiAnomalyLogSchema));
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].priority).toBe('high');
    expect(logs[0].anomalyScore).toBe(84.5);
  });

  it('GET /audit/anomaly-summary satisfies AnomalySummarySchema', async () => {
    const res = await harness.http.get('/audit/anomaly-summary').expect(200);
    const summary = expectContract(res.body, AnomalySummarySchema);
    expect(summary.emitenTerdeteksiAnomali).toBe(3);
    expect(summary.rataDeviasiEmisi).toBe(18.4);
  });

  it('GET /audit/energy-correlation satisfies EnergyCorrelationItemSchema array', async () => {
    const res = await harness.http.get('/audit/energy-correlation').expect(200);
    const list = expectContract(res.body, z.array(EnergyCorrelationItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].reported).toBe(15000);
  });

  it('GET /audit/spatial-summary satisfies SpatialSummarySchema', async () => {
    const res = await harness.http.get('/audit/spatial-summary').expect(200);
    const summary = expectContract(res.body, SpatialSummarySchema);
    expect(summary.areaHectares).toBe(124500);
  });

  it('GET /audit/ml-status returns ONNX model status envelope', async () => {
    const res = await harness.http.get('/audit/ml-status').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isLoaded).toBe(true);
    expect(res.body.data.modelPath).toContain('.onnx');
  });
});
