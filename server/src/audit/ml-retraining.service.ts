import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { EmissionReportStatus } from '@prisma/client';
import { findWorkspaceRoot } from '../common/utils';
import { MlAuditEngineService } from './ml-audit-engine.service';

export interface RetrainingTriggerOptions {
  force?: boolean;
  dryRun?: boolean;
}

export interface RetrainingExecutionResult {
  success: boolean;
  triggered: boolean;
  modelSwapped: boolean;
  durationMs: number;
  output: string;
  error?: string;
}

export interface MlRetrainingStatus {
  isRetrainingRunning: boolean;
  isModelLoaded: boolean;
  modelPath: string | null;
  verifiedReportsCount: number;
  metadata: Record<string, unknown> | null;
  lastRetrainingLog: Record<string, unknown> | null;
}

@Injectable()
export class MlRetrainingService {
  private readonly logger = new Logger(MlRetrainingService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mlAuditEngineService: MlAuditEngineService,
  ) {}

  /**
   * Returns current operational status of the ML model, feedback pool, and retraining history.
   */
  public async getStatus(): Promise<MlRetrainingStatus> {
    const workspaceRoot = findWorkspaceRoot(__dirname);
    const mlDir = path.join(workspaceRoot, 'ml');

    // 1. Count verified reports in PostgreSQL
    const verifiedReportsCount = await this.prisma.emissionReport.count({
      where: {
        status: {
          in: [
            EmissionReportStatus.APPROVED,
            EmissionReportStatus.REVISION_REQUIRED,
            EmissionReportStatus.REJECTED,
          ],
        },
      },
    });

    // 2. Read model_metadata.json
    let metadata: Record<string, unknown> | null = null;
    const metadataPath = path.join(mlDir, 'models/model_metadata.json');
    if (fs.existsSync(metadataPath)) {
      try {
        const raw = fs.readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(raw) as Record<string, unknown>;
      } catch (err) {
        this.logger.warn(
          `Failed to parse model_metadata.json: ${(err as Error).message}`,
        );
      }
    }

    // 3. Read latest entry in retraining_log.jsonl
    let lastRetrainingLog: Record<string, unknown> | null = null;
    const logPath = path.join(mlDir, 'models/retraining_log.jsonl');
    if (fs.existsSync(logPath)) {
      try {
        const lines = fs
          .readFileSync(logPath, 'utf-8')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (lines.length > 0) {
          lastRetrainingLog = JSON.parse(lines[lines.length - 1]) as Record<
            string,
            unknown
          >;
        }
      } catch (err) {
        this.logger.warn(
          `Failed to parse retraining_log.jsonl: ${(err as Error).message}`,
        );
      }
    }

    return {
      isRetrainingRunning: this.isRunning,
      isModelLoaded: this.mlAuditEngineService.isModelLoaded(),
      modelPath: this.mlAuditEngineService.getModelPath(),
      verifiedReportsCount,
      metadata,
      lastRetrainingLog,
    };
  }

  /**
   * Queries verified emission reports directly from PostgreSQL and synchronizes them
   * to ml/data/production/feedback_pool.csv for the Python retraining pipeline.
   *
   * @returns Total number of feedback records written to CSV
   */
  public async exportVerifiedReportsToFeedbackPool(): Promise<number> {
    const reports = await this.prisma.emissionReport.findMany({
      where: {
        status: {
          in: [
            EmissionReportStatus.APPROVED,
            EmissionReportStatus.REVISION_REQUIRED,
            EmissionReportStatus.REJECTED,
          ],
        },
      },
      include: {
        company: true,
      },
      orderBy: { submittedAt: 'asc' },
    });

    const workspaceRoot = findWorkspaceRoot(__dirname);
    const feedbackDir = path.join(workspaceRoot, 'ml/data/production');
    const feedbackCsvPath = path.join(feedbackDir, 'feedback_pool.csv');

    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    const headers = [
      'company_id',
      'report_period',
      'verificator_id',
      'verificator_verdict',
      'ml_prediction',
      'sector',
      'production_tonnes',
      'reported_emissions_tco2e',
      'reported_scope1_tco2e',
      'reported_scope2_tco2e',
      'reported_scope3_tco2e',
      'historical_emissions_tco2e',
      'stat_fuel_liters',
      'mob_fuel_liters',
      'coal_kg',
      'gas_m3',
      'electricity_kwh',
      'cost_solar_idr',
      'cost_coal_idr',
      'cost_gas_idr',
      'cost_pln_idr',
      'clinker_tonnes',
      'is_anomaly',
      'anomaly_type',
      'received_at',
    ];

    const rows: string[] = [headers.join(',')];

    for (const report of reports) {
      const isApproved = report.status === EmissionReportStatus.APPROVED;
      const verdict = isApproved ? 'PASS_VERIFIED' : 'REJECT_ANOMALY';
      const isAnomaly = isApproved ? 0 : 1;
      const anomalyType = isApproved ? 'NORMAL' : 'VERIFICATOR_FLAGGED';

      const calc = (report.calculationData as Record<string, unknown>) || {};
      const sector =
        report.sector || report.company?.sector || 'Manufaktur & Pengolahan';
      const totalEmissions = Number(report.totalEmissionsTco2e ?? 0);

      const scope1 = Number(calc['scope1'] ?? totalEmissions * 0.6);
      const scope2 = Number(calc['scope2'] ?? totalEmissions * 0.35);
      const scope3 = Number(calc['scope3'] ?? 0);

      const productionTonnes = Number(calc['productionTonnes'] ?? 10000);
      const statFuelLiters = Number(calc['statFuelLiters'] ?? 0);
      const mobFuelLiters = Number(calc['mobFuelLiters'] ?? 0);
      const coalKg = Number(calc['coalKg'] ?? 0);
      const gasM3 = Number(calc['gasM3'] ?? 0);
      const electricityKwh = Number(calc['electricityKwh'] ?? 0);
      const costSolarIdr = Number(calc['costSolarIdr'] ?? 0);
      const costCoalIdr = Number(calc['costCoalIdr'] ?? 0);
      const costGasIdr = Number(calc['costGasIdr'] ?? 0);
      const costPlnIdr = Number(calc['costPlnIdr'] ?? 0);
      const clinkerTonnes = Number(calc['clinkerTonnes'] ?? 0);

      const rowValues = [
        report.companyId,
        `${report.year}`,
        report.auditedByUserId || 'system',
        verdict,
        '',
        `"${sector}"`,
        productionTonnes,
        totalEmissions,
        scope1,
        scope2,
        scope3,
        totalEmissions,
        statFuelLiters,
        mobFuelLiters,
        coalKg,
        gasM3,
        electricityKwh,
        costSolarIdr,
        costCoalIdr,
        costGasIdr,
        costPlnIdr,
        clinkerTonnes,
        isAnomaly,
        anomalyType,
        (report.auditedAt || report.createdAt).toISOString(),
      ];

      rows.push(rowValues.join(','));
    }

    fs.writeFileSync(feedbackCsvPath, rows.join('\n') + '\n', 'utf-8');
    this.logger.log(
      `Synchronized ${reports.length} verified reports from PostgreSQL into: ${feedbackCsvPath}`,
    );

    return reports.length;
  }

  /**
   * Executes the Python retraining pipeline locally on the host via child process.
   * On successful retraining and model swap, hot-reloads the ONNX model in MlAuditEngineService.
   */
  public async triggerRetraining(
    options: RetrainingTriggerOptions = {},
  ): Promise<RetrainingExecutionResult> {
    if (this.isRunning) {
      throw new ConflictException('ML model retraining is currently running.');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // 1. Synchronize PostgreSQL verified audit decisions to feedback_pool.csv
      await this.exportVerifiedReportsToFeedbackPool();

      // 2. Prepare command and arguments
      const workspaceRoot = findWorkspaceRoot(__dirname);
      const mlDir = path.join(workspaceRoot, 'ml');

      const args: string[] = ['run', 'retrain'];
      if (options.force) {
        args.push('--force');
      }
      if (options.dryRun) {
        args.push('--dry-run');
      }

      this.logger.log(
        `Spawning retraining process in '${mlDir}': poetry ${args.join(' ')}`,
      );

      // 3. Execute child process asynchronously
      const { stdout, stderr, exitCode } = await this.spawnProcess(
        'poetry',
        args,
        mlDir,
      );

      const durationMs = Date.now() - startTime;
      const combinedOutput = `${stdout}\n${stderr}`.trim();

      if (exitCode !== 0) {
        this.logger.error(
          `Retraining process failed with exit code ${exitCode} after ${durationMs}ms:\n${combinedOutput}`,
        );
        return {
          success: false,
          triggered: true,
          modelSwapped: false,
          durationMs,
          output: combinedOutput,
          error: `Process exited with code ${exitCode}`,
        };
      }

      // Check output flags
      const triggered = combinedOutput.includes('Triggered          : True');
      const modelSwapped = combinedOutput.includes('Model Swapped      : True');

      this.logger.log(
        `Retraining finished in ${durationMs}ms. Triggered=${triggered}, ModelSwapped=${modelSwapped}`,
      );

      // 4. Hot-reload ONNX runtime session in memory if model was swapped
      if (modelSwapped && !options.dryRun) {
        this.logger.log(
          'Model artifact was swapped. Triggering hot-reload in MlAuditEngineService...',
        );
        const reloadSuccess = await this.mlAuditEngineService.reloadModel();
        if (!reloadSuccess) {
          this.logger.warn(
            'Model hot-reload returned false. Review ONNX session state.',
          );
        }
      }

      return {
        success: true,
        triggered,
        modelSwapped,
        durationMs,
        output: combinedOutput,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      this.logger.error(
        `Error during retraining execution (${durationMs}ms): ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new InternalServerErrorException(
        `ML retraining failed: ${(err as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Helper to spawn a child process with a timeout.
   */
  private spawnProcess(
    command: string,
    args: string[],
    cwd: string,
    timeoutMs: number = 300000, // 5 minutes
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      // On Windows, use shell: true to resolve poetry executable properly
      const child = spawn(command, args, {
        cwd,
        shell: process.platform === 'win32',
        env: { ...process.env },
      });

      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Retraining process timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code: number) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      });

      child.on('error', (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
