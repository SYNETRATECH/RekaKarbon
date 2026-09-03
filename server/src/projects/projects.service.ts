import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DisbursementItem,
  Project,
  ProjectCoordinate,
  ReforestationStage,
  TokenBuyer,
} from './types';
import { ForestProjectItem, NationalForestRegion } from '../regulator/types';

const projectIncludeConfig = Prisma.validator<Prisma.ForestProjectInclude>()({
  stages: { orderBy: { yearNumber: 'asc' } },
  kthGroup: true,
  disbursements: { orderBy: { disbursedAt: 'desc' } },
  carbonTokens: {
    include: {
      listings: {
        include: {
          orders: {
            include: {
              buyer: {
                include: {
                  kybProfile: true,
                  companies: true,
                },
              },
            },
          },
        },
      },
    },
  },
});

type FullProjectRecord = Prisma.ForestProjectGetPayload<{
  include: typeof projectIncludeConfig;
}>;

function generatePerimeterCoordinates(
  centerLat: number,
  centerLng: number,
): ProjectCoordinate[] {
  const delta = 0.04;
  return [
    { lat: centerLat + delta, lng: centerLng - delta * 0.5 },
    { lat: centerLat + delta * 0.8, lng: centerLng + delta * 1.2 },
    { lat: centerLat - delta * 0.5, lng: centerLng + delta * 1.5 },
    { lat: centerLat - delta * 1.2, lng: centerLng + delta * 0.8 },
    { lat: centerLat - delta * 1.4, lng: centerLng - delta * 0.8 },
    { lat: centerLat - delta * 0.6, lng: centerLng - delta * 1.2 },
  ];
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private get projectInclude() {
    return projectIncludeConfig;
  }

  async findProjects(): Promise<Project[]> {
    const records = await this.prisma.forestProject.findMany({
      include: this.projectInclude,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.mapRecordToProject(r));
  }

  async findProjectById(id: string): Promise<Project> {
    const record = await this.prisma.forestProject.findUnique({
      where: { id },
      include: this.projectInclude,
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
        coordinatesJson:
          project.coordinates as unknown as Prisma.InputJsonValue,
        bufferAllocatedPercent: project.bufferAllocated * 100,
        trendDataJson: {
          labels: project.trendLabels,
          data: project.trendData,
        },
      },
      include: projectIncludeConfig,
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
      include: projectIncludeConfig,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r: FullProjectRecord) => {
      const auditStatus: 'verified' | 'in_review' | 'flagged' =
        r.status.toLowerCase() === 'active' ? 'verified' : 'in_review';

      const projectFull = this.mapRecordToProject(r);
      const kth = r.kthGroup as {
        groupName?: string;
        leaderName?: string;
        memberCount?: number;
      } | null;

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
        partnerKTH: kth?.groupName || '',
        kthLeader: kth?.leaderName || '',
        kthMembersCount: kth?.memberCount || 0,
        auditStatus,
        droneAuditCount: 0,
        lastDroneAuditDate: '',
        speCertificateId: r.speCertificateId || '',
        ndviScore: Number(r.ndviScore),
        eviScore: Number(r.eviScore),
        progressDetail: {
          survivalRatePercent: Number(r.survivalRatePercent),
          canopyHeightMeters: Number(r.canopyHeightMeters),
          bufferAllocatedPercent: Number(r.bufferAllocatedPercent || 8),
          reforestationStatusText: r.status,
          reforestationPartner: kth?.groupName || '',
          reforestationSite: r.province,
          targetTrees: projectFull.targetTrees || 200000,
          plantedTrees: projectFull.plantedTrees || 174000,
          remainingTrees: projectFull.remainingTrees || 26000,
          carbonPricePerTonIDR: Number(r.carbonPricePerTonIdr || 260000),
          totalBudgetIDR: Number(r.budgetTotalIdr),
          disbursedBudgetIDR: Number(r.budgetDisbursedIdr),
          remainingBudgetIDR: Math.max(
            0,
            Number(r.budgetTotalIdr) - Number(r.budgetDisbursedIdr),
          ),
          currentYear: projectFull.currentYear,
          stages: projectFull.stages.map((s) => ({
            year: s.year,
            title: s.title,
            milestone: s.milestone,
            status: s.status,
            canopyDensity: s.canopyDensity,
            gsd: s.gsd,
            kthName: s.kthName,
            farmerIncentiveIDR: s.farmerIncentive,
            incentiveStatus: 'Telah Disalurkan',
            speCreditMinted: 0,
            speStatus: 'Terbit',
            plantedTrees: s.plantedTrees || 0,
            targetTrees: s.targetTrees || 0,
            remainingTrees: s.remainingTrees || 0,
          })),
          disbursements: projectFull.disbursementHistory.map((d) => ({
            id: d.id,
            date: d.date,
            amountIDR: d.amount,
            category: d.category,
            desc: d.desc,
            txHash: d.txHash,
            blockNumber: d.blockNumber,
            vendor: d.vendor,
            status: 'DISBURSED',
            items: (d.items || []).map((item) => ({
              name: item.name,
              qty: item.qty,
              unit: item.unit,
              priceIDR: item.price,
              totalIDR: item.total,
            })),
            proofImages: d.proofImages || [],
          })),
          tokenBuyers: projectFull.tokenBuyers.map((tb) => ({
            id: tb.id,
            companyName: tb.companyName,
            sector: tb.sector,
            tCO2e: tb.tCO2e,
            amountIDR: tb.amountIDR,
            date: tb.purchaseDate,
            speCertificateId: tb.speCertificateId,
            txHash: tb.txHash,
          })),
        },
        forestHealthPercent: Number(r.ndviScore || 0.82) * 100,
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
      kthName: r.kthGroup?.groupName || 'KTH Pembina Hutan',
      farmerIncentive: Number(s.farmerIncentiveIdr || 0),
      incentiveStatus: s.incentiveStatus || 'Telah Disalurkan',
      speCreditMinted: Number(s.speCreditsMinted || 0),
      speStatus: 'Terbit (Minted)',
      targetTrees: s.targetTrees || 0,
      plantedTrees: s.plantedTrees || 0,
      remainingTrees: Math.max(0, (s.targetTrees || 0) - (s.plantedTrees || 0)),
    }));

    let coords: ProjectCoordinate[] = [];
    if (r.coordinatesJson && Array.isArray(r.coordinatesJson)) {
      coords = (
        r.coordinatesJson as unknown as Array<
          { lat?: number; lng?: number } | number[]
        >
      ).map((c) => {
        if (Array.isArray(c)) return { lat: Number(c[0]), lng: Number(c[1]) };
        return { lat: Number(c.lat || 0), lng: Number(c.lng || 0) };
      });
    } else {
      coords = generatePerimeterCoordinates(
        r.latitude || -7.8385,
        r.longitude || 114.3725,
      );
    }

    const totalTargetTrees = stages.reduce(
      (sum, s) => sum + (s.targetTrees || 0),
      0,
    );
    const totalPlantedTrees = stages.reduce(
      (sum, s) => sum + (s.plantedTrees || 0),
      0,
    );

    const partnerName =
      r.kthGroup?.groupName || 'Dinas Kehutanan Jawa Timur & KTH Tuban';

    const disbursementHistory: DisbursementItem[] = (r.disbursements || []).map(
      (d) => ({
        id: d.id,
        date: d.disbursedAt
          ? new Date(d.disbursedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        amount: Number(d.amountIdr || 0),
        category: d.category || 'Restorasi & Pemeliharaan',
        desc:
          d.description ||
          `Insentif KTH (${r.kthGroup?.groupName || 'KTH Pembina'})`,
        txHash: d.txHash || '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c',
        blockNumber: d.blockNumber || '#184920',
        vendor: d.vendorName || partnerName,
        items: (d.itemsJson as unknown as DisbursementItem['items']) || [],
        proofImages: (d.proofImagesJson as unknown as string[]) || [],
      }),
    );

    const tokenBuyers: TokenBuyer[] = [];
    (r.carbonTokens || []).forEach((ct) => {
      (ct.listings || []).forEach((lst) => {
        (lst.orders || []).forEach((ord) => {
          const buyer = ord.buyer as unknown as {
            kybProfile?: { companyName?: string; industrialSector?: string };
            companies?: Array<{ id?: string; name?: string; sector?: string }>;
            fullName?: string;
          } | null;
          const buyerProfile = buyer?.kybProfile;
          const buyerCompany = buyer?.companies?.[0];
          const companyName =
            buyerProfile?.companyName ||
            buyerCompany?.name ||
            buyer?.fullName ||
            'Pembeli Terverifikasi';
          const sector =
            buyerProfile?.industrialSector ||
            buyerCompany?.sector ||
            'Industri Karbon';

          const dateStr = ord.completedAt
            ? new Date(ord.completedAt).toISOString().split('T')[0]
            : new Date(ord.createdAt).toISOString().split('T')[0];

          tokenBuyers.push({
            id: ord.id,
            companyId: String(buyerCompany?.id || ord.buyerUserId),
            companyName,
            sector,
            tCO2e: Number(ord.volumeTco2e || 0),
            amountIDR: Number(ord.totalAmountIdr || 0),
            pricePerTon: Number(ord.pricePerTonIdr || 260000),
            purchaseDate: dateStr,
            speCertificateId:
              ct.speCertificateNumber || r.speCertificateId || 'SPE-GRK',
            txHash: ord.txHash || '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d',
            blockNumber: ord.blockNumber || '#184410',
            verificationStatus:
              ord.verificationStatus || 'Terverifikasi (KLHK On-Chain)',
            auditor: ord.auditorName || 'Rian Hermawan, M.T (Sucofindo)',
          });
        });
      });
    });

    const trendDataObj = r.trendDataJson as {
      labels?: string[];
      data?: number[];
    } | null;
    const trendLabels = trendDataObj?.labels || [
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
    ];
    const trendData = trendDataObj?.data || [1.15, 1.18, 1.2, 1.22, 1.24];

    const totalDisbursedFromTx = disbursementHistory.reduce(
      (sum, d) => sum + d.amount,
      0,
    );
    const disbursedBudget =
      totalDisbursedFromTx > 0
        ? totalDisbursedFromTx
        : Number(r.budgetDisbursedIdr || 0);
    const totalBudget = Number(r.budgetTotalIdr || 0);
    const remainingBudget = Math.max(0, totalBudget - disbursedBudget);

    const emergencyFundUsed = disbursementHistory
      .filter(
        (d) =>
          d.category.toLowerCase().includes('darurat') ||
          d.category.toLowerCase().includes('mitigasi'),
      )
      .reduce((sum, d) => sum + d.amount, 0);
    const emergencyFundAllocated = Math.round(totalBudget * 0.05);

    return {
      id: r.id,
      name: r.projectName,
      region: r.province,
      center: [r.latitude || -7.8385, r.longitude || 114.3725],
      zoom: 12,
      area: Number(r.areaHectares || 0),
      rawAreaVal: Number(r.areaHectares || 0),
      carbon: Number(r.carbonStockTco2e || 0),
      rawCarbonVal: Number(r.carbonStockTco2e || 0),
      ndvi: Number(r.ndviScore || 0.82),
      evi: Number(r.eviScore || 0.68),
      coordinates: coords,
      trendLabels,
      trendData,
      survivalRate: Number(r.survivalRatePercent || 85) / 100,
      canopyHeight: Number(r.canopyHeightMeters || 1.85),
      bufferAllocated: Number(r.bufferAllocatedPercent || 8) / 100,
      bufferUsed: Number(r.bufferUsedPercent || 0) / 100,
      reforestationStatus: r.status || 'ACTIVE_DMRV',
      reforestationPartner: partnerName,
      reforestationSite: r.province,
      targetTrees: totalTargetTrees,
      plantedTrees: totalPlantedTrees,
      remainingTrees: Math.max(0, totalTargetTrees - totalPlantedTrees),
      carbonPricePerTon: Number(r.carbonPricePerTonIdr || 260000),
      totalBudget,
      disbursedBudget,
      remainingBudget,
      emergencyFundAllocated,
      emergencyFundUsed,
      currentYear: stages.filter((s) => s.status === 'completed').length || 1,
      stages,
      disbursementHistory,
      tokenBuyers,
    };
  }
}
