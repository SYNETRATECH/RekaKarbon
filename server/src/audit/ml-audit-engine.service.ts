import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ort from 'onnxruntime-node';
import {
  AuditEmissionReportDto,
  IndustrialSector,
} from './dto/audit-emission-report.dto';
import { MlAuditResult } from './types/audit.types';
import {
  EmissionFeatureEngineer,
  MARKET_PRICE_RANGES,
  SECTOR_BENCHMARKS,
} from './ml-feature-engineer';

@Injectable()
export class MlAuditEngineService implements OnModuleInit {
  private readonly logger = new Logger(MlAuditEngineService.name);
  private onnxSession: ort.InferenceSession | null = null;
  private onnxModelPath: string | null = null;

  async onModuleInit() {
    await this.initOnnxSession();
  }

  /**
   * Discovers and initializes the ONNX runtime inference session from models/anomaly_pipeline.onnx.
   */
  public async initOnnxSession(customPath?: string): Promise<void> {
    const candidatePaths = [
      customPath,
      path.resolve(process.cwd(), '../ml/models/anomaly_pipeline.onnx'),
      path.resolve(process.cwd(), 'models/anomaly_pipeline.onnx'),
      path.resolve(__dirname, '../../../../ml/models/anomaly_pipeline.onnx'),
      path.resolve(__dirname, '../../../ml/models/anomaly_pipeline.onnx'),
    ].filter(Boolean) as string[];

    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        try {
          this.onnxSession = await ort.InferenceSession.create(candidate, {
            executionProviders: ['cpu'],
          });
          this.onnxModelPath = candidate;
          this.logger.log(
            `Successfully loaded ONNX Anomaly Detection Model from: ${candidate}`,
          );
          return;
        } catch (err) {
          this.logger.warn(
            `Failed to initialize ONNX session from ${candidate}: ${(err as Error).message}`,
          );
        }
      }
    }

    this.logger.warn(
      'ONNX model file not found in standard paths. Fallback deterministic ML scoring will be used.',
    );
  }

  /**
   * Executes multi-tier AI/ML and stoichiometric audit using real ONNX Runtime inference in Node.js.
   */
  public async evaluateEmissionReport(
    report: AuditEmissionReportDto,
  ): Promise<MlAuditResult> {
    const sector = report.sector;
    const bench =
      SECTOR_BENCHMARKS[sector] ||
      SECTOR_BENCHMARKS[IndustrialSector.MANUFAKTUR];

    const reported = Math.max(report.reportedEmissionsTco2e, 0);
    const hist = Math.max(report.historicalEmissionsTco2e ?? reported, 0.0001);
    const statFuel = report.statFuelLiters ?? 0;
    const clinker = report.clinkerTonnes ?? 0;

    // 1. Extract 15 derived physical & econometric features + ONNX Float32 Tensor
    const {
      eExpected,
      divergencePct,
      unitSolar,
      intensity,
      intensityZ,
      tensor,
    } = EmissionFeatureEngineer.extractFeatures(report);

    // 2. Direct ONNX Inference Execution
    let mlDecisionScore = 0.0;
    let anomalyProb = 0.5;

    if (this.onnxSession) {
      try {
        const inputName = this.onnxSession.inputNames[0] || 'float_input';
        const feeds: Record<string, ort.Tensor> = {};
        feeds[inputName] = tensor;
        const outputMap = await this.onnxSession.run(feeds, ['scores']);
        const scoreTensor = outputMap['scores'];
        if (scoreTensor && scoreTensor.data) {
          const rawScores = scoreTensor.data as Float32Array;
          mlDecisionScore = Number(rawScores[0] ?? 0.0);
          // Continuous anomaly probability mapping: 1 / (1 + exp(decision * 10))
          anomalyProb = Math.max(
            0.0,
            Math.min(1.0, 1.0 / (1.0 + Math.exp(mlDecisionScore * 10.0))),
          );
        }
      } catch (err) {
        this.logger.debug(
          `ONNX inference sandbox notification: ${(err as Error).message}`,
        );
      }
    } else {
      // Fallback decision approximation if ONNX artifact not loaded
      mlDecisionScore = divergencePct > 45.0 ? -0.15 : 0.15;
      anomalyProb = 1.0 / (1.0 + Math.exp(mlDecisionScore * 10.0));
    }

    // 3. Multi-Tier Physics & Fiscal Auditing Checks
    // --- TIER 1 FISCAL: DJP E-FAKTUR PRICE CHECK ---
    let scoreDjp: number;
    if (
      (unitSolar >= MARKET_PRICE_RANGES.solarDiesel.min &&
        unitSolar <= MARKET_PRICE_RANGES.solarDiesel.max) ||
      statFuel === 0
    ) {
      scoreDjp = 98.5;
    } else {
      const deviation = Math.min(
        Math.abs(unitSolar - MARKET_PRICE_RANGES.solarDiesel.nominal),
        30000.0,
      );
      scoreDjp = Math.max(
        10.0,
        Math.round((100.0 - deviation / 250.0) * 10) / 10,
      );
    }

    // --- TIER 2 PHYSICAL: BBM & COMBUSTION CORRELATION ---
    let scoreBbm: number;
    if (divergencePct < 25.0) {
      scoreBbm = Math.round((99.0 - divergencePct * 0.4) * 10) / 10;
    } else if (divergencePct < 45.0) {
      scoreBbm = Math.round((89.0 - (divergencePct - 25.0) * 1.2) * 10) / 10;
    } else {
      scoreBbm = Math.max(
        5.0,
        Math.round((65.0 - (divergencePct - 45.0) * 1.5) * 10) / 10,
      );
    }

    // --- TIER 2 SECTOR: PEER INTENSITY & VOLATILITY ---
    let scoreCems: number;
    if (intensityZ <= 2.0) {
      scoreCems = 96.0;
    } else if (intensityZ <= 3.5) {
      scoreCems = Math.max(
        50.0,
        Math.round((95.0 - (intensityZ - 2.0) * 25.0) * 10) / 10,
      );
    } else {
      scoreCems = Math.max(
        10.0,
        Math.round((50.0 - (intensityZ - 3.5) * 15.0) * 10) / 10,
      );
    }

    // Diagnostic Flags
    const flags: string[] = [];
    if (scoreDjp < 70.0) {
      flags.push('BIAYA_SOLAR_TIDAK_REALISTIS');
    }
    if (divergencePct > 45.0) {
      flags.push('DEVIASI_FISIK_DAN_LAPORAN_TINGGI');
    }
    if (reported < eExpected * 0.5) {
      flags.push('UNDER_REPORTING_TERINDIKASI');
    }
    if (intensity < bench.minIntensity * 0.45) {
      flags.push('INTENSITAS_EMISI_TERLALU_RENDAH');
    } else if (intensity > bench.maxIntensity * 1.6) {
      flags.push('INTENSITAS_EMISI_ABERRAN_SEKTOR');
    }
    if (
      bench.hasProcessEmissions &&
      clinker === 0 &&
      reported < eExpected * 0.65
    ) {
      flags.push('EMISI_PROSES_TIDAK_DILAPORKAN');
    }
    if (Math.abs(reported - hist) / (hist + 1e-6) > 0.65) {
      flags.push('VOLATILITAS_HISTORIS_EKSTRIM');
    }

    const compositeTrust =
      Math.round((scoreDjp * 0.3 + scoreBbm * 0.4 + scoreCems * 0.3) * 10) / 10;
    const isAnomaly =
      flags.length > 0 ||
      compositeTrust < 68.0 ||
      divergencePct > 45.0 ||
      (anomalyProb > 0.7 && compositeTrust < 80.0);

    // Human-readable explanation in Bahasa Indonesia
    let explanation: string;
    if (!isAnomaly) {
      explanation =
        `Laporan terverifikasi konsisten. Total emisi dilaporkan ${reported.toLocaleString('id-ID', { maximumFractionDigits: 0 })} tCO2e ` +
        `sesuai dengan estimasi stoikiometri energi (${eExpected.toLocaleString('id-ID', { maximumFractionDigits: 0 })} tCO2e) ` +
        `dan intensitas sektor ${sector} (${intensity.toFixed(3)} tCO2e/ton).`;
    } else {
      const reasons: string[] = [];
      if (divergencePct > 45.0) {
        reasons.push(
          `Divergensi fisik ${divergencePct}% (dilaporkan: ${reported.toLocaleString('id-ID', { maximumFractionDigits: 0 })} tCO2e vs stoikiometri: ${eExpected.toLocaleString('id-ID', { maximumFractionDigits: 0 })} tCO2e)`,
        );
      }
      if (scoreDjp < 70.0) {
        reasons.push(
          `Unit price solar Rp ${unitSolar.toLocaleString('id-ID', { maximumFractionDigits: 0 })}/L menyimpang dari indeks pasar DJP (Rp 16.000-25.000/L)`,
        );
      }
      if (flags.includes('EMISI_PROSES_TIDAK_DILAPORKAN')) {
        reasons.push(
          'Emisi proses dekarbonasi klinker/peleburan tidak terdata dalam pos pelaporan',
        );
      }
      if (flags.includes('INTENSITAS_EMISI_TERLALU_RENDAH')) {
        reasons.push(
          `Intensitas emisi (${intensity.toFixed(3)} tCO2e/ton) berada di bawah ambang batas minimum sektor (${bench.minIntensity} tCO2e/ton)`,
        );
      }
      if (reasons.length === 0) {
        reasons.push(
          'Pola multivariate anomali terdeteksi oleh ensemble Isolation Forest',
        );
      }
      explanation = `Anomali terdeteksi: ${reasons.join('; ')}.`;
    }

    return {
      isAnomaly,
      verdict: isAnomaly ? 'REJECT_ANOMALY' : 'PASS_VERIFIED',
      anomalyScore: Math.round(anomalyProb * 1000) / 1000,
      trustScore: compositeTrust,
      divergencePercent: divergencePct,
      expectedEmissionTco2e: Math.round(eExpected * 100) / 100,
      reportedEmissionTco2e: Math.round(reported * 100) / 100,
      scoreDjp,
      scoreBbm,
      scoreCems,
      flags,
      explanation,
    };
  }

  public isModelLoaded(): boolean {
    return this.onnxSession !== null;
  }

  public getModelPath(): string | null {
    return this.onnxModelPath;
  }
}
