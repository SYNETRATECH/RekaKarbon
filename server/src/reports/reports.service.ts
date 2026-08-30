import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { StorageService } from '../storage/storage.service';
import { ethers } from 'ethers';
import { ComplianceRating, Prisma } from '@prisma/client';
import { PtbaeService } from '../compliance/ptbae.service';
import type { CalculatorCalculationData } from './types';

type CalculatorScopeData = Partial<CalculatorCalculationData>;
const CARBON_OFFSET_RATE_IDR = 650000;

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly storageService: StorageService,
    private readonly ptbaeService: PtbaeService,
  ) {}

  async getEmissionReports(user?: { userId: string; role: string }) {
    let whereClause = {};
    if (user && user.role === 'emitter') {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.userId },
        include: { companies: true },
      });
      if (dbUser && dbUser.companies.length > 0) {
        whereClause = { companyId: dbUser.companies[0].id };
      }
    }

    const reports = await this.prisma.emissionReport.findMany({
      where: whereClause,
      include: {
        company: true,
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      reports.map(async (r) => {
        const actual = Number(r.totalEmissionsTco2e);
        const quota = await this.ptbaeService.resolveForCompany(
          r.companyId,
          r.year,
        );
        const calculationData =
          r.calculationData &&
          typeof r.calculationData === 'object' &&
          !Array.isArray(r.calculationData)
            ? (r.calculationData as CalculatorScopeData)
            : null;
        const getScopeValue = (value: unknown) =>
          typeof value === 'number' && Number.isFinite(value) ? value : 0;
        const scope1 = getScopeValue(calculationData?.scope1);
        const scope2 = getScopeValue(calculationData?.scope2);
        const scope3 = getScopeValue(calculationData?.scope3);
        return {
          id: r.id,
          year: r.year,
          title: `Laporan Emisi Tahunan ${r.company.name} ${r.year}`,
          fileName: r.files[0]?.originalFileName || 'No File',
          fileSizeBytes: Number(
            r.files.reduce((acc, f) => acc + f.fileSizeBytes, 0n),
          ),
          uploadDate: r.createdAt.toISOString().split('T')[0],
          status: r.status.toLowerCase(),
          totalEmissionsTCO2e: actual,
          blockchainTxHash: r.blockchainTxHash,
          blockchainReportId: r.blockchainReportId
            ? Number(r.blockchainReportId)
            : null,
          merkleRoot: r.merkleRoot,
          quotaPTBAETCO2e: quota.quotaTCO2e,
          quotaPTBAEStatus: quota.status,
          quotaPTBAESourceDocument: quota.sourceDocument,
          method: r.reportMethod,
          sectorId: r.sector,
          sectors:
            r.reportMethod === 'CALCULATOR' && calculationData
              ? [
                  {
                    id: `sec-${r.id}-1`,
                    name: 'Scope 1 (Pembakaran & Operasional)',
                    scope: 'Scope 1',
                    emissionsTCO2e: scope1,
                    percentage: actual > 0 ? (scope1 / actual) * 100 : 0,
                    description: 'Emisi langsung dari operasional',
                    color: '#ef4444',
                  },
                  {
                    id: `sec-${r.id}-2`,
                    name: 'Scope 2 (Listrik)',
                    scope: 'Scope 2',
                    emissionsTCO2e: scope2,
                    percentage: actual > 0 ? (scope2 / actual) * 100 : 0,
                    description: 'Emisi dari penggunaan listrik',
                    color: '#f59e0b',
                  },
                  {
                    id: `sec-${r.id}-3`,
                    name: 'Scope 3 (Rantai Pasok)',
                    scope: 'Scope 3',
                    emissionsTCO2e: scope3,
                    percentage: actual > 0 ? (scope3 / actual) * 100 : 0,
                    description:
                      'Emisi dari rantai pasok dan operasional eksternal',
                    color: '#3b82f6',
                  },
                ]
              : [],
        };
      }),
    );
  }

  private async synchronizeCompanyCompliance(
    companyId: string,
    actualEmissionTCO2e: number,
    quotaPTBAETCO2e: number | null,
  ) {
    const deficitTCO2e = this.ptbaeService.calculateDeficit(
      actualEmissionTCO2e,
      quotaPTBAETCO2e,
    );
    const data: Prisma.CompanyUpdateInput = {
      actualEmissionTco2e: actualEmissionTCO2e,
    };

    if (deficitTCO2e === null) {
      await this.prisma.company.update({ where: { id: companyId }, data });
      return;
    }

    data.carbonDeficitTco2e = deficitTCO2e;
    data.offsetCostIdr = deficitTCO2e * CARBON_OFFSET_RATE_IDR;
    data.complianceRating =
      deficitTCO2e > 0
        ? ComplianceRating.NON_COMPLIANT
        : ComplianceRating.COMPLIANT;

    await this.prisma.company.update({
      where: { id: companyId },
      data,
    });
  }

  private generateMerkleRoot(dataObj: Record<string, unknown>): string {
    try {
      const leaves = Object.keys(dataObj)
        .sort()
        .map((key) =>
          ethers.keccak256(
            ethers.toUtf8Bytes(`${key}:${JSON.stringify(dataObj[key])}`),
          ),
        );

      let root = leaves.length > 0 ? leaves[0] : ethers.ZeroHash;
      for (let i = 1; i < leaves.length; i++) {
        const pair = [root, leaves[i]].sort();
        root = ethers.keccak256(ethers.concat(pair));
      }
      return root;
    } catch {
      throw new BadRequestException('Invalid JSON report data');
    }
  }

  async submitReport(
    userId: string,
    year: number,
    sector: string,
    totalEmissions: number,
    files: Array<Express.Multer.File>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: true },
    });
    if (!user) throw new BadRequestException('User not found');
    const company = user.companies[0];
    if (!company) throw new BadRequestException('User has no company');
    const quota = await this.ptbaeService.resolveForCompany(company.id, year);

    const existingReport = await this.prisma.emissionReport.findUnique({
      where: {
        companyId_year: {
          companyId: company.id,
          year: year,
        },
      },
    });
    if (existingReport) {
      throw new BadRequestException(
        `Laporan emisi untuk tahun ${year} sudah pernah dikirimkan oleh perusahaan Anda.`,
      );
    }

    const uploadedFilesData: {
      originalFileName: string;
      fileSizeBytes: bigint;
      mimeType: string;
      storageKey: string;
      accessUrl: string;
      fileHash: string;
      category: 'EMISSION_REPORT';
    }[] = [];
    for (const file of files) {
      const minioPath = await this.storageService.uploadFileToMinio(
        file,
        `reports/${company.id}/${year}`,
      );
      const accessUrl = await this.storageService.getFileUrl(minioPath);
      const fileHash = ethers.keccak256(file.buffer);

      uploadedFilesData.push({
        originalFileName: file.originalname,
        fileSizeBytes: BigInt(file.size),
        mimeType: file.mimetype,
        storageKey: minioPath,
        accessUrl,
        fileHash,
        category: 'EMISSION_REPORT' as const,
      });
    }

    const reportMetadata = {
      year,
      totalEmissionsTCO2e: totalEmissions,
      companyId: company.id,
      files: uploadedFilesData.map((f) => ({
        name: f.originalFileName,
        hash: f.fileHash,
      })),
    };

    const merkleRoot = this.generateMerkleRoot(reportMetadata);
    this.logger.log(`Generated Merkle Root for year ${year}: ${merkleRoot}`);

    try {
      const { txHash, reportId } =
        await this.blockchainService.submitEmissionReport(year, merkleRoot);
      this.logger.log(
        `Successfully submitted report on-chain. TX: ${txHash}, ReportID: ${reportId}`,
      );

      const report = await this.prisma.emissionReport.create({
        data: {
          year,
          totalEmissionsTco2e: totalEmissions,
          status: 'SUBMITTED',
          merkleRoot,
          blockchainTxHash: txHash,
          blockchainReportId: BigInt(reportId),
          companyId: company.id,
          sector,
          files: {
            create: uploadedFilesData.map((f) => ({
              originalFileName: f.originalFileName,
              fileSizeBytes: f.fileSizeBytes,
              mimeType: f.mimeType,
              storageKey: f.storageKey,
              accessUrl: f.accessUrl,
              category: f.category,
              uploadedByUserId: user.id,
            })),
          },
        },
      });
      await this.synchronizeCompanyCompliance(
        company.id,
        totalEmissions,
        quota.quotaTCO2e,
      );

      return {
        id: report.id,
        year,
        merkleRoot,
        txHash,
        blockchainReportId: Number(reportId),
      };
    } catch (error: unknown) {
      this.logger.error('Failed to process report', error);
      const e = error as Record<string, unknown>;
      const errMsg = typeof e?.message === 'string' ? e.message : String(error);
      throw new InternalServerErrorException(
        'Failed to process report: ' + errMsg,
      );
    }
  }

  async submitCalculatorReport(
    userId: string,
    year: number,
    sector: string,
    totalEmissions: number,
    calculationData: CalculatorCalculationData,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: true },
    });
    if (!user) throw new BadRequestException('User not found');
    const company = user.companies[0];
    if (!company) throw new BadRequestException('User has no company');
    const quota = await this.ptbaeService.resolveForCompany(company.id, year);

    const existingReport = await this.prisma.emissionReport.findUnique({
      where: {
        companyId_year: {
          companyId: company.id,
          year: year,
        },
      },
    });
    if (existingReport) {
      throw new BadRequestException(
        `Laporan emisi untuk tahun ${year} sudah pernah dikirimkan oleh perusahaan Anda.`,
      );
    }

    const reportMetadata = {
      year,
      totalEmissionsTCO2e: totalEmissions,
      companyId: company.id,
      sector,
      calculationData,
    };

    const merkleRoot = this.generateMerkleRoot(reportMetadata);
    this.logger.log(
      `Generated Merkle Root for calculator year ${year}: ${merkleRoot}`,
    );

    try {
      const { txHash, reportId } =
        await this.blockchainService.submitEmissionReport(year, merkleRoot);
      this.logger.log(
        `Successfully submitted calculator report on-chain. TX: ${txHash}, ReportID: ${reportId}`,
      );

      const report = await this.prisma.emissionReport.create({
        data: {
          year,
          totalEmissionsTco2e: totalEmissions,
          status: 'SUBMITTED',
          reportMethod: 'CALCULATOR',
          sector,
          calculationData,
          merkleRoot,
          blockchainTxHash: txHash,
          blockchainReportId: BigInt(reportId),
          companyId: company.id,
        },
      });
      await this.synchronizeCompanyCompliance(
        company.id,
        totalEmissions,
        quota.quotaTCO2e,
      );

      return {
        id: report.id,
        year,
        merkleRoot,
        txHash,
        blockchainReportId: Number(reportId),
      };
    } catch (error: unknown) {
      this.logger.error('Failed to process calculator report', error);
      const e = error as Record<string, unknown>;
      const errMsg = typeof e?.message === 'string' ? e.message : String(error);
      throw new InternalServerErrorException(
        'Failed to process calculator report: ' + errMsg,
      );
    }
  }
}
