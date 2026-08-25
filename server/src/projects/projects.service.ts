import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ForestProject as PrismaForestProject,
  ProjectStage as PrismaProjectStage,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Project, ReforestationStage } from './types';
import { ForestProjectItem, NationalForestRegion } from '../regulator/types';

type FullProjectRecord = PrismaForestProject & {
  stages?: PrismaProjectStage[];
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findProjects(): Promise<Project[]> {
    const records = await this.prisma.forestProject.findMany({
      include: { stages: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapRecordToProject(r));
  }

  async findProjectById(id: string): Promise<Project> {
    const record = await this.prisma.forestProject.findUnique({
      where: { id },
      include: { stages: true },
    });
    if (!record) {
      throw new NotFoundException(
        `Forest project with ID '${id}' was not found`,
      );
    }
    return this.mapRecordToProject(record);
  }

  async createProject(project: Project): Promise<Project> {
    let region = await this.prisma.nationalForestRegion.findFirst();
    if (!region) {
      region = await this.prisma.nationalForestRegion.create({
        data: {
          regionName: project.region,
          areaHectares: project.area,
          carbonSequestrationTco2e: project.carbon,
          fundingDisbursedIdr: project.disbursedBudget,
          forestHealthPercent: 95.0,
        },
      });
    }

    const created = await this.prisma.forestProject.create({
      data: {
        id: project.id,
        regionId: region.id,
        projectName: project.name,
        province: project.region,
        latitude: project.center[0],
        longitude: project.center[1],
        areaHectares: project.area,
        targetSequestrationTco2e: project.carbon,
        actualSequestrationTco2e: project.carbon,
        carbonStockTco2e: project.carbon,
        ndviScore: project.ndvi,
        eviScore: project.evi,
        survivalRatePercent: project.survivalRate * 100,
        canopyHeightMeters: project.canopyHeight,
        budgetTotalIdr: project.totalBudget,
        budgetDisbursedIdr: project.disbursedBudget,
      },
      include: { stages: true },
    });
    return this.mapRecordToProject(created);
  }

  async findNationalForestRegions(): Promise<NationalForestRegion[]> {
    const records = await this.prisma.nationalForestRegion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => ({
      id: r.id,
      regionName: r.regionName,
      areaHectares: Number(r.areaHectares),
      carbonSequestrationTCO2e: Number(r.carbonSequestrationTco2e),
      fundingDisbursedIDR: Number(r.fundingDisbursedIdr),
      forestHealthPercent: Number(r.forestHealthPercent),
    }));
  }

  async findForestProjects(): Promise<ForestProjectItem[]> {
    const records = await this.prisma.forestProject.findMany({
      include: { kthGroup: true, stages: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => {
      const auditStatus: 'verified' | 'in_review' | 'flagged' =
        r.status.toLowerCase() === 'active' ? 'verified' : 'in_review';

      const totalTargetTrees = (r.stages || []).reduce(
        (acc, s) => acc + s.targetTrees,
        0,
      );
      const totalPlantedTrees = (r.stages || []).reduce(
        (acc, s) => acc + s.plantedTrees,
        0,
      );

      return {
        id: r.id,
        projectName: r.projectName,
        region: r.province,
        ecosystemType: r.ecosystemType.toLowerCase().replace(/_/g, ' '),
        areaHectares: Number(r.areaHectares),
        targetSequestrationTCO2e: Number(r.targetSequestrationTco2e),
        actualSequestrationTCO2e: Number(r.actualSequestrationTco2e),
        carbonStockTCO2e: Number(r.carbonStockTco2e),
        fundingBudgetIDR: Number(r.budgetTotalIdr),
        fundingDisbursedIDR: Number(r.budgetDisbursedIdr),
        partnerKTH: r.kthGroup?.groupName || '',
        kthLeader: r.kthGroup?.leaderName || '',
        kthMembersCount: r.kthGroup?.memberCount || 0,
        auditStatus,
        droneAuditCount: 0,
        lastDroneAuditDate: '',
        speCertificateId: r.speCertificateId || '',
        ndviScore: Number(r.ndviScore),
        eviScore: Number(r.eviScore),
        progressDetail: {
          survivalRatePercent: Number(r.survivalRatePercent),
          canopyHeightMeters: Number(r.canopyHeightMeters),
          bufferAllocatedPercent: 0,
          bufferUsedPercent: 0,
          reforestationStatusText: r.status,
          reforestationPartner: r.kthGroup?.groupName || '',
          reforestationSite: r.province,
          targetTrees: totalTargetTrees,
          plantedTrees: totalPlantedTrees,
          remainingTrees: Math.max(0, totalTargetTrees - totalPlantedTrees),
          carbonPricePerTonIDR: Number(r.carbonPricePerTonIdr),
          totalBudgetIDR: Number(r.budgetTotalIdr),
          disbursedBudgetIDR: Number(r.budgetDisbursedIdr),
          remainingBudgetIDR: Math.max(
            0,
            Number(r.budgetTotalIdr) - Number(r.budgetDisbursedIdr),
          ),
          currentYear: 1,
          stages: (r.stages || []).map((s) => ({
            year: s.yearNumber,
            title: s.title,
            milestone: s.milestoneDescription || '',
            status:
              s.status.toLowerCase() === 'completed' ? 'completed' : 'ongoing',
            canopyDensity: Number(s.canopyDensityPercent || 0),
            gsd: 2.5,
            kthName: r.kthGroup?.groupName || '',
            farmerIncentiveIDR: Number(s.farmerIncentiveIdr),
            incentiveStatus: s.incentiveStatus || '',
            speCreditMinted: Number(s.speCreditsMinted),
            speStatus: 'Terbit (Minted)',
            plantedTrees: s.plantedTrees,
            targetTrees: s.targetTrees,
            remainingTrees: Math.max(0, s.targetTrees - s.plantedTrees),
          })),
          disbursements: [],
          tokenBuyers: [],
        },
      };
    });
  }

  private mapRecordToProject(r: FullProjectRecord): Project {
    const stages: ReforestationStage[] = (r.stages || []).map((s) => ({
      year: s.yearNumber,
      title: s.title,
      milestone: s.milestoneDescription || '',
      status: s.status.toLowerCase() === 'completed' ? 'completed' : 'ongoing',
      canopyDensity: Number(s.canopyDensityPercent || 0),
      gsd: 2.5,
      kthName: '',
      farmerIncentive: Number(s.farmerIncentiveIdr || 0),
      incentiveStatus: s.incentiveStatus || '',
      speCreditMinted: Number(s.speCreditsMinted || 0),
      speStatus: 'Terbit (Minted)',
      plantedTrees: s.plantedTrees,
      targetTrees: s.targetTrees,
    }));

    return {
      id: r.id,
      name: r.projectName,
      region: r.province,
      center: [r.latitude || 0, r.longitude || 0],
      zoom: 12,
      area: Number(r.areaHectares || 0),
      rawAreaVal: Number(r.areaHectares || 0),
      carbon: Number(r.carbonStockTco2e || 0),
      rawCarbonVal: Number(r.carbonStockTco2e || 0),
      ndvi: Number(r.ndviScore || 0),
      evi: Number(r.eviScore || 0),
      coordinates: [],
      trendLabels: [],
      trendData: [],
      survivalRate: Number(r.survivalRatePercent || 0) / 100,
      canopyHeight: Number(r.canopyHeightMeters || 0),
      bufferAllocated: 0,
      bufferUsed: 0,
      reforestationStatus: r.status,
      reforestationPartner: '',
      reforestationSite: r.province,
      totalBudget: Number(r.budgetTotalIdr || 0),
      disbursedBudget: Number(r.budgetDisbursedIdr || 0),
      remainingBudget: Math.max(
        0,
        Number(r.budgetTotalIdr || 0) - Number(r.budgetDisbursedIdr || 0),
      ),
      currentYear: 1,
      stages,
      disbursementHistory: [],
      tokenBuyers: [],
    };
  }
}
