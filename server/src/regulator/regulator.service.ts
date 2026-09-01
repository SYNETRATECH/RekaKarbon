import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  NationalForestRegion,
  ForestProjectItem,
  KTHTransactionItem,
  RegulationDocumentUploadItem,
} from './types';

@Injectable()
export class RegulatorService {
  constructor(private readonly prisma: PrismaService) {}

  async getNationalForestRegions(): Promise<NationalForestRegion[]> {
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

  async getForestProjects(): Promise<ForestProjectItem[]> {
    const records = await this.prisma.forestProject.findMany({
      include: { kthGroup: true, stages: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => {
      const auditStatus: 'verified' | 'in_review' | 'flagged' =
        r.status.toLowerCase() === 'active' ? 'verified' : 'in_review';

      return {
        id: r.id,
        projectName: r.projectName,
        region: r.province,
        ecosystemType: r.ecosystemType.toLowerCase().replace(/_/g, ' '),
        coordinates: [r.latitude, r.longitude],
        areaHectares: Number(r.areaHectares),
        targetSequestrationTCO2e: Number(r.targetSequestrationTco2e),
        actualSequestrationTCO2e: Number(r.actualSequestrationTco2e),
        carbonStockTCO2e: Number(r.carbonStockTco2e),
        fundingBudgetIDR: Number(r.budgetTotalIdr),
        fundingDisbursedIDR: Number(r.budgetDisbursedIdr),
        partnerKTH: r.kthGroup?.groupName || 'KTH Mitra',
        kthLeader: r.kthGroup?.leaderName || 'Ketua KTH',
        kthMembersCount: r.kthGroup?.memberCount || 50,
        auditStatus,
        droneAuditCount: 2,
        lastDroneAuditDate: '2026-02-14',
        speCertificateId: r.speCertificateId || 'SPE-GRK-REKA-2026',
        ndviScore: Number(r.ndviScore),
        eviScore: Number(r.eviScore),
        progressDetail: {
          survivalRatePercent: Number(r.survivalRatePercent),
          canopyHeightMeters: Number(r.canopyHeightMeters),
          bufferAllocatedPercent: 10,
          bufferUsedPercent: 0,
          reforestationStatusText: 'Aktif dMRV',
          reforestationPartner: 'BPDAS KLHK',
          reforestationSite: r.province,
          targetTrees: 50000,
          plantedTrees: 45000,
          remainingTrees: 5000,
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
            kthName: r.kthGroup?.groupName || 'KTH Mitra',
            farmerIncentiveIDR: Number(s.farmerIncentiveIdr),
            incentiveStatus: s.incentiveStatus || 'Telah Disalurkan',
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

  async getKTHGroups() {
    const records = await this.prisma.kthGroup.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map((g) => ({
      id: g.id,
      groupName: g.groupName,
      leaderName: g.leaderName,
      memberCount: g.memberCount,
      location: g.location,
      kybStatus: g.kybStatus.toLowerCase(),
      registrationNumber: g.registrationNumber || 'SK.LHK-8832/KTH/2023',
      totalIncentiveReceivedIDR: Number(g.totalIncentiveReceivedIdr),
      walletAddress:
        g.walletAddress || '0x8a1c948571029485710294857102948571029485',
    }));
  }

  async getKTHTransactions(): Promise<KTHTransactionItem[]> {
    const records = await this.prisma.kthIncentiveDisbursement.findMany({
      include: { kthGroup: true, project: true },
      orderBy: { disbursedAt: 'desc' },
    });
    return records.map((d) => ({
      id: d.id,
      txHash: d.txHash || '0x8a1c94857102948571029485710294857102948571029485',
      date: d.disbursedAt.toISOString(),
      kthName: d.kthGroup?.groupName || 'KTH Mangrove Tuban Mandiri',
      projectName:
        d.project?.projectName || 'Restorasi Mangrove Hutan Lindung Tuban',
      volumeTCO2e: Number(d.volumeTco2e),
      amountIDR: Number(d.amountIdr),
      status: 'completed',
    }));
  }

  async getRegulationUploads(): Promise<RegulationDocumentUploadItem[]> {
    const records = await this.prisma.storedFile.findMany({
      where: {
        category: { in: ['LEGAL_SK', 'EMISSION_REPORT'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((f) => {
      const cat: 'sk_ptbae' | 'spe_grk' | 'stp_djp' | 'kth_sk' =
        f.category === 'LEGAL_SK' ? 'sk_ptbae' : 'stp_djp';

      return {
        id: f.id,
        documentTitle: f.originalFileName
          .replace(/\.pdf$/i, '')
          .replace(/_/g, ' '),
        category: cat,
        categoryLabel:
          f.category === 'LEGAL_SK' ? 'SK Penetapan PTBAE' : 'Laporan Emisi',
        agencyIssuer: 'KLHK & DJP',
        fileName: f.originalFileName,
        fileSize: Number(f.fileSizeBytes),
        uploadDate: f.createdAt.toISOString(),
        signatoryPerson: 'Direktorat Jenderal PPI KLHK',
        targetEntityName: 'Emiten Industri',
        status: 'published',
      };
    });
  }
}
