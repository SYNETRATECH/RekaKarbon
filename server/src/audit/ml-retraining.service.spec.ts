import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { MlRetrainingService } from './ml-retraining.service';
import { PrismaService } from '../prisma/prisma.service';
import { MlAuditEngineService } from './ml-audit-engine.service';
import { EmissionReportStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { findWorkspaceRoot } from '../common/utils';

describe('MlRetrainingService', () => {
  let service: MlRetrainingService;
  let prisma: {
    emissionReport: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let mlAuditEngineService: {
    isModelLoaded: jest.Mock;
    getModelPath: jest.Mock;
    reloadModel: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      emissionReport: {
        count: jest.fn().mockResolvedValue(12),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rep-001',
            companyId: 'comp-001',
            year: 2025,
            totalEmissionsTco2e: 48200.0,
            status: EmissionReportStatus.APPROVED,
            sector: 'Manufaktur & Pengolahan',
            calculationData: {
              scope1: 28920,
              scope2: 16870,
              scope3: 2410,
              productionTonnes: 450000,
              statFuelLiters: 4850000,
              mobFuelLiters: 1240000,
              electricityKwh: 15000000,
              costSolarIdr: 99425000000,
            },
            auditedByUserId: 'auditor-1',
            auditedAt: new Date('2025-06-15T10:00:00Z'),
            createdAt: new Date('2025-06-10T10:00:00Z'),
            company: {
              sector: 'Manufaktur & Pengolahan',
            },
          },
          {
            id: 'rep-002',
            companyId: 'comp-002',
            year: 2025,
            totalEmissionsTco2e: 1500.0,
            status: EmissionReportStatus.REVISION_REQUIRED,
            sector: 'Semen & Bahan Bangunan',
            calculationData: {
              scope1: 500,
              scope2: 1000,
              productionTonnes: 200000,
            },
            auditedByUserId: 'auditor-2',
            auditedAt: new Date('2025-06-16T11:00:00Z'),
            createdAt: new Date('2025-06-11T10:00:00Z'),
            company: {
              sector: 'Semen & Bahan Bangunan',
            },
          },
        ]),
      },
    };

    mlAuditEngineService = {
      isModelLoaded: jest.fn().mockReturnValue(true),
      getModelPath: jest.fn().mockReturnValue('/path/to/anomaly_pipeline.onnx'),
      reloadModel: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MlRetrainingService,
        { provide: PrismaService, useValue: prisma },
        { provide: MlAuditEngineService, useValue: mlAuditEngineService },
      ],
    }).compile();

    service = module.get<MlRetrainingService>(MlRetrainingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getStatus should return model status, verified report count, and metadata', async () => {
    const status = await service.getStatus();

    expect(status).toBeDefined();
    expect(status.verifiedReportsCount).toBe(12);
    expect(status.isModelLoaded).toBe(true);
    expect(status.modelPath).toBe('/path/to/anomaly_pipeline.onnx');
    expect(status.isRetrainingRunning).toBe(false);
  });

  it('exportVerifiedReportsToFeedbackPool should query database and write feedback CSV', async () => {
    const count = await service.exportVerifiedReportsToFeedbackPool();

    expect(prisma.emissionReport.findMany).toHaveBeenCalledTimes(1);
    expect(count).toBe(2);

    // Verify the file was created and contains the mapped records
    const workspaceRoot = findWorkspaceRoot(__dirname);
    const feedbackCsvPath = path.join(
      workspaceRoot,
      'ml/data/production/feedback_pool.csv',
    );
    expect(fs.existsSync(feedbackCsvPath)).toBe(true);

    const writtenContent = fs.readFileSync(feedbackCsvPath, 'utf-8');
    expect(writtenContent).toContain('company_id,report_period');
    expect(writtenContent).toContain('comp-001');
    expect(writtenContent).toContain('PASS_VERIFIED');
    expect(writtenContent).toContain('comp-002');
    expect(writtenContent).toContain('REJECT_ANOMALY');
  });

  it('triggerRetraining should spawn child process and trigger hot-reload on model swap', async () => {
    jest
      .spyOn(service, 'exportVerifiedReportsToFeedbackPool')
      .mockResolvedValue(2);

    // Mock spawnProcess helper
    const mockOutput = [
      '====================================================================',
      ' RETRAINING RESULT SUMMARY',
      '====================================================================',
      '  Triggered          : True',
      '  Trigger Reason     : SCHEDULE_DUE',
      '  Days Since Retrain : 8.5',
      '  Quality Gate       : True',
      '  Model Swapped      : True',
      '  New Version        : 20260907_120000',
      '====================================================================',
    ].join('\n');

    jest.spyOn(service as any, 'spawnProcess').mockResolvedValue({
      stdout: mockOutput,
      stderr: '',
      exitCode: 0,
    });

    const result = await service.triggerRetraining({
      force: true,
      dryRun: false,
    });

    expect(result.success).toBe(true);
    expect(result.triggered).toBe(true);
    expect(result.modelSwapped).toBe(true);
    expect(mlAuditEngineService.reloadModel).toHaveBeenCalledTimes(1);
  });

  it('triggerRetraining should prevent concurrent runs', async () => {
    (service as any).isRunning = true;

    await expect(service.triggerRetraining()).rejects.toThrow(
      ConflictException,
    );
  });

  it('triggerRetraining should not hot-reload if dryRun is true', async () => {
    jest
      .spyOn(service, 'exportVerifiedReportsToFeedbackPool')
      .mockResolvedValue(2);

    const mockOutput = 'Triggered : True\nModel Swapped : True';
    jest.spyOn(service as any, 'spawnProcess').mockResolvedValue({
      stdout: mockOutput,
      stderr: '',
      exitCode: 0,
    });

    const result = await service.triggerRetraining({ dryRun: true });

    expect(result.success).toBe(true);
    expect(mlAuditEngineService.reloadModel).not.toHaveBeenCalled();
  });
});
