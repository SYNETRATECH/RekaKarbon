import { Test, TestingModule } from '@nestjs/testing';
import * as path from 'path';
import { MlAuditEngineService } from './ml-audit-engine.service';
import { IndustrialSector } from './dto/audit-emission-report.dto';

describe('MlAuditEngineService', () => {
  let service: MlAuditEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MlAuditEngineService],
    }).compile();

    service = module.get<MlAuditEngineService>(MlAuditEngineService);
    // Explicitly point to the ONNX artifact from workspace
    const onnxPath = path.resolve(
      __dirname,
      '../../../ml/models/anomaly_pipeline.onnx',
    );
    await service.initOnnxSession(onnxPath);
  });

  it('should be defined and initialize ONNX session', () => {
    expect(service).toBeDefined();
    expect(service.isModelLoaded()).toBe(true);
  });

  it('should verify a compliant normal manufacturing company report with ONNX execution', async () => {
    const normalPayload = {
      sector: IndustrialSector.MANUFAKTUR,
      productionTonnes: 450000.0,
      reportedEmissionsTco2e: 48200.0,
      historicalEmissionsTco2e: 47200.0,
      statFuelLiters: 4850000.0,
      mobFuelLiters: 1240000.0,
      biomassTonnes: 0.0,
      clinkerTonnes: 0.0,
      costSolarIdr: 4850000.0 * 20500.0, // Rp 20,500 / L
      costCoalIdr: 12800000000.0,
      costGasIdr: 3100000000.0,
      costPlnIdr: 8950000000.0,
    };

    const result = await service.evaluateEmissionReport(normalPayload);

    expect(result.isAnomaly).toBe(false);
    expect(result.verdict).toBe('PASS_VERIFIED');
    expect(result.trustScore).toBeGreaterThan(80.0);
    expect(result.scoreDjp).toBeGreaterThan(90.0);
    expect(result.flags.length).toBe(0);
    expect(result.explanation).toContain('Laporan terverifikasi konsisten');
  });

  it('should detect under-reporting fraud with high physical divergence and ONNX flag', async () => {
    const fraudPayload = {
      sector: IndustrialSector.MANUFAKTUR,
      productionTonnes: 450000.0,
      reportedEmissionsTco2e: 1000.0, // Severely under-reported
      historicalEmissionsTco2e: 47200.0,
      statFuelLiters: 4850000.0,
      mobFuelLiters: 1240000.0,
      biomassTonnes: 0.0,
      clinkerTonnes: 0.0,
      costSolarIdr: 4850000.0 * 20500.0,
      costCoalIdr: 12800000000.0,
      costGasIdr: 3100000000.0,
      costPlnIdr: 8950000000.0,
    };

    const result = await service.evaluateEmissionReport(fraudPayload);

    expect(result.isAnomaly).toBe(true);
    expect(result.verdict).toBe('REJECT_ANOMALY');
    expect(result.divergencePercent).toBeGreaterThan(50.0);
    expect(result.flags).toContain('UNDER_REPORTING_TERINDIKASI');
    expect(result.flags).toContain('DEVIASI_FISIK_DAN_LAPORAN_TINGGI');
  });

  it('should flag abnormal solar price outside DJP e-Faktur index', async () => {
    const fakePricePayload = {
      sector: IndustrialSector.CPO,
      productionTonnes: 300000.0,
      reportedEmissionsTco2e: 12000.0,
      historicalEmissionsTco2e: 12000.0,
      statFuelLiters: 2000000.0,
      mobFuelLiters: 500000.0,
      biomassTonnes: 5000.0,
      clinkerTonnes: 0.0,
      costSolarIdr: 2000000.0 * 800.0, // Rp 800 / L (subsidized/fraudulent invoice)
      costCoalIdr: 0.0,
      costGasIdr: 0.0,
      costPlnIdr: 2000000000.0,
    };

    const result = await service.evaluateEmissionReport(fakePricePayload);

    expect(result.isAnomaly).toBe(true);
    expect(result.scoreDjp).toBeLessThan(70.0);
    expect(result.flags).toContain('BIAYA_SOLAR_TIDAK_REALISTIS');
    expect(result.explanation).toContain('Unit price solar');
  });

  it('should detect cement sector omitting clinker calcination process emissions', async () => {
    const cementFraudPayload = {
      sector: IndustrialSector.SEMEN,
      productionTonnes: 500000.0,
      reportedEmissionsTco2e: 20000.0, // 15x under-reported
      historicalEmissionsTco2e: 320000.0,
      statFuelLiters: 2000000.0,
      mobFuelLiters: 500000.0,
      biomassTonnes: 10000.0,
      clinkerTonnes: 0.0, // Calcination omitted
      costSolarIdr: 2000000.0 * 20500.0,
      costCoalIdr: 85000000000.0,
      costGasIdr: 0.0,
      costPlnIdr: 25000000000.0,
    };

    const result = await service.evaluateEmissionReport(cementFraudPayload);

    expect(result.isAnomaly).toBe(true);
    expect(result.verdict).toBe('REJECT_ANOMALY');
    expect(result.flags).toContain('EMISI_PROSES_TIDAK_DILAPORKAN');
  });
});
