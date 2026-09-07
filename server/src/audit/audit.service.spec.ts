import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: {
    forestProject: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
    droneMission: {
      findMany: jest.Mock;
    };
    emissionReport: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    company: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
    carbonToken: {
      findFirst: jest.Mock;
    };
    kthIncentiveDisbursement: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      forestProject: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      droneMission: {
        findMany: jest.fn(),
      },
      emissionReport: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      company: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      carbonToken: {
        findFirst: jest.fn(),
      },
      kthIncentiveDisbursement: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('getDroneArchive', () => {
    it('should return dynamic drone archive when project is found', async () => {
      const mockProject = {
        id: 'proj-1',
        projectName: 'Restorasi Baluran',
        province: 'Jawa Timur',
        ndviScore: 0.82,
        droneMissions: [
          {
            id: 'm-1',
            status: 'COMPLETED',
            orthophotoFile: {
              accessUrl: 'https://storage.rekakarbon.id/ortho.tif',
            },
            pointcloudFile: null,
            droneModel: 'DJI Matrice 350 RTK',
          },
        ],
      };

      prisma.forestProject.findUnique.mockResolvedValue(mockProject);

      const result = await service.getDroneArchive('proj-1');
      expect(result.areaName).toBe('Restorasi Baluran');
      expect(result.location).toBe('Jawa Timur');
      expect(typeof result.cloudCoverPercent).toBe('number');
      expect(result.cloudCoverPercent).toBeGreaterThanOrEqual(8);
      expect(result.cloudCoverPercent).toBeLessThanOrEqual(95);
      expect(result.layers).toHaveLength(3);
      expect(result.layers[0].statusType).toBe('ready');
      expect(result.layers[0].fileUrl).toBe(
        'https://storage.rekakarbon.id/ortho.tif',
      );
      // No UI-formatted strings in layer
      const layerObj = result.layers[0] as unknown as Record<string, unknown>;
      expect(layerObj.status).toBeUndefined();
      expect(layerObj.title).toBeUndefined();
    });

    it('should throw NotFoundException when project is not found', async () => {
      prisma.forestProject.findUnique.mockResolvedValue(null);

      await expect(service.getDroneArchive('invalid-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDroneSchedules', () => {
    it('should return raw numeric schedule data when project is found', async () => {
      const mockProject = {
        id: 'proj-1',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        droneMissions: [
          { status: 'COMPLETED', flightDate: new Date('2025-01-15') },
          { status: 'SCHEDULED', flightDate: new Date('2025-07-15') },
        ],
      };

      prisma.forestProject.findUnique.mockResolvedValue(mockProject);

      const result = await service.getDroneSchedules('proj-1');
      expect(result.startYear).toBe(2025);
      expect(result.endYear).toBe(2030);
      expect(result.year1.frequencyPerYear).toBe(4);
      expect(result.year1.frequency).toBe('quarterly');
      expect(result.year1.slots).toHaveLength(4);
      expect(result.year1.slots[0].month).toBe(1); // January as integer
      expect(result.year1.slots[0].status).toBe('done');
      expect(result.year2.frequencyPerYear).toBe(3);
      expect(result.year2.frequency).toBe('triannual');
      expect(result.year2.slots).toHaveLength(3);
      expect(result.year3to5.frequencyPerYear).toBe(1);
      expect(result.year3to5.frequency).toBe('annual');
      expect(result.year3to5.slots).toHaveLength(1);
      // No UI-formatted strings
      const resultObj = result as unknown as Record<string, unknown>;
      const year1Obj = result.year1 as unknown as Record<string, unknown>;
      const slotObj = result.year1.slots[0] as unknown as Record<
        string,
        unknown
      >;
      expect(resultObj.period).toBeUndefined();
      expect(year1Obj.title).toBeUndefined();
      expect(year1Obj.badge).toBeUndefined();
      expect(slotObj.label).toBeUndefined();
    });

    it('should throw NotFoundException when project is not found', async () => {
      prisma.forestProject.findUnique.mockResolvedValue(null);

      await expect(service.getDroneSchedules('invalid-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDroneScans', () => {
    it('should return mapped drone missions with numeric resolution', async () => {
      prisma.droneMission.findMany.mockResolvedValue([
        {
          id: 'mission-1',
          flightDate: new Date('2026-03-01'),
          coverageHectares: 120,
          gsdCmPx: 2.5,
          status: 'COMPLETED',
          project: {
            projectName: 'Taman Nasional Baluran',
            carbonStockTco2e: 45000,
          },
        },
      ]);

      const scans = await service.getDroneScans();
      expect(scans).toHaveLength(1);
      expect(scans[0].id).toBe('mission-1');
      expect(scans[0].location).toBe('Taman Nasional Baluran');
      expect(scans[0].areaCoveredHa).toBe(120);
      expect(scans[0].resolutionGsdCmPx).toBe(2.5);
      expect(scans[0].operator).toBeNull();
      // No UI-formatted strings
      const scanObj = scans[0] as unknown as Record<string, unknown>;
      expect(scanObj.resolutionGSD).toBeUndefined();
    });
  });

  describe('getAiAnomalyLogs', () => {
    it('should map emission reports with auditResult into AiAnomalyLog', async () => {
      prisma.emissionReport.findMany.mockResolvedValue([
        {
          id: 'rep-1',
          companyId: 'comp-1',
          year: 2026,
          sector: 'manufaktur',
          totalEmissionsTco2e: 1200,
          status: 'SUBMITTED',
          company: { name: 'PT Semen Maju', sector: 'Semen' },
          auditResult: {
            isAnomaly: true,
            verdict: 'REJECT_ANOMALY',
            anomalyScore: 0.92,
            trustScore: 45,
            divergencePercent: 48.5,
            expectedEmissionTco2e: 2300,
            scoreDjp: 55,
            scoreBbm: 40,
            scoreCems: 40,
            explanation: 'Divergensi fisik tinggi',
          },
          calculationData: null,
        },
      ]);

      const logs = await service.getAiAnomalyLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('rep-1');
      expect(logs[0].company).toBe('PT Semen Maju');
      expect(logs[0].anomalyScore).toBe(0.92);
      expect(logs[0].priority).toBe('critical');
      expect(logs[0].eFakturMatch).toBe(false);
      expect(logs[0].auditStatus).toBe('pending');
    });
  });

  describe('getAnomalySummary', () => {
    it('should aggregate anomaly counts and divergence accurately', async () => {
      prisma.emissionReport.findMany.mockResolvedValue([
        {
          companyId: 'comp-1',
          auditResult: {
            isAnomaly: true,
            divergencePercent: 40,
            scoreDjp: 60,
          },
        },
        {
          companyId: 'comp-2',
          auditResult: {
            isAnomaly: false,
            divergencePercent: 10,
            scoreDjp: 95,
          },
        },
      ]);
      prisma.company.findMany.mockResolvedValue([
        { id: 'comp-1' },
        { id: 'comp-2' },
      ]);

      const summary = await service.getAnomalySummary();
      expect(summary.emitenTerdeteksiAnomali).toBe(1);
      expect(summary.totalEmitenAktif).toBe(2);
      expect(summary.rataDeviasiEmisi).toBe(25);
      expect(summary.eFakturTidakCocok).toBe(1);
    });
  });
});
