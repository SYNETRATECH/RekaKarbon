import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { StorageService } from '../storage/storage.service';
import { ethers } from 'ethers';
import { ComplianceRating, EmissionReportStatus, Prisma } from '@prisma/client';
import { PtbaeService } from '../compliance/ptbae.service';
import type {
  CalculatorCalculationData,
  CalculatorScopeData,
  EmissionReport,
  EmissionReportFilingStatus,
  EmitterWalletUser,
  ReportSubmissionResult,
  ReportUploadedFileData,
} from './types';
import { CalculationService } from './calculation.service';
import { MlAuditEngineService } from '../audit/ml-audit-engine.service';
import { ReportsMlAdapter } from './reports-ml-adapter';
import type { MlAuditResult } from '../audit/types/ml-audit.types';
import type { AuthenticatedUserPayload } from '../auth/types';
import {
  CARBON_OFFSET_RATE_IDR,
  SCOPE_SECTOR_METADATA,
  generateMerkleRoot,
} from './utils';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly storageService: StorageService,
    private readonly ptbaeService: PtbaeService,
    private readonly calculationService: CalculationService,
    private readonly mlAuditEngineService: MlAuditEngineService,
  ) {}

  private resolveEmitterWallet(user: EmitterWalletUser): string {
    if (!user.walletAddress) {
      throw new BadRequestException('Emitter wallet address is not configured');
    }

    try {
      return ethers.getAddress(user.walletAddress);
    } catch {
      throw new BadRequestException(
        'Emitter wallet address is not a valid EVM address',
      );
    }
  }

  async getEmissionReports(
    user?: AuthenticatedUserPayload | { userId: string; role: string },
  ): Promise<EmissionReport[]> {
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
          status: r.status.toLowerCase() as EmissionReportFilingStatus,
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
          calculationData: r.calculationData,
          auditResult:
            (r.auditResult as unknown as MlAuditResult | null) ||
            ((r.calculationData as Record<string, unknown> | null)
              ?.auditResult as MlAuditResult | null) ||
            null,
          sectors:
            r.reportMethod === 'CALCULATOR' && calculationData
              ? [
                  {
                    id: `sec-${r.id}-1`,
                    name: SCOPE_SECTOR_METADATA.scope1.name,
                    scope: SCOPE_SECTOR_METADATA.scope1.scope,
                    emissionsTCO2e: scope1,
                    percentage: actual > 0 ? (scope1 / actual) * 100 : 0,
                    description: SCOPE_SECTOR_METADATA.scope1.description,
                    color: SCOPE_SECTOR_METADATA.scope1.color,
                  },
                  {
                    id: `sec-${r.id}-2`,
                    name: SCOPE_SECTOR_METADATA.scope2.name,
                    scope: SCOPE_SECTOR_METADATA.scope2.scope,
                    emissionsTCO2e: scope2,
                    percentage: actual > 0 ? (scope2 / actual) * 100 : 0,
                    description: SCOPE_SECTOR_METADATA.scope2.description,
                    color: SCOPE_SECTOR_METADATA.scope2.color,
                  },
                  {
                    id: `sec-${r.id}-3`,
                    name: SCOPE_SECTOR_METADATA.scope3.name,
                    scope: SCOPE_SECTOR_METADATA.scope3.scope,
                    emissionsTCO2e: scope3,
                    percentage: actual > 0 ? (scope3 / actual) * 100 : 0,
                    description: SCOPE_SECTOR_METADATA.scope3.description,
                    color: SCOPE_SECTOR_METADATA.scope3.color,
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

  async submitReport(
    userId: string,
    year: number,
    sector: string,
    totalEmissions: number,
    files: Array<Express.Multer.File>,
  ): Promise<ReportSubmissionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: true },
    });
    if (!user) throw new BadRequestException('User not found');
    const company = user.companies[0];
    if (!company) throw new BadRequestException('User has no company');
    const reporterAddress = this.resolveEmitterWallet(user);
    const quota = await this.ptbaeService.resolveForCompany(company.id, year);

    const existingReport = await this.prisma.emissionReport.findUnique({
      where: {
        companyId_year: {
          companyId: company.id,
          year: year,
        },
      },
    });
    if (
      existingReport &&
      existingReport.status !== EmissionReportStatus.REVISION_REQUIRED
    ) {
      throw new ConflictException(
        `Laporan emisi untuk tahun ${year} sudah dikirimkan dan belum dapat dikirim ulang.`,
      );
    }

    const uploadedFilesData: ReportUploadedFileData[] = [];
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

    const merkleRoot = generateMerkleRoot(reportMetadata);
    this.logger.log(`Generated Merkle Root for year ${year}: ${merkleRoot}`);

    try {
      const { txHash, reportId } =
        await this.blockchainService.submitEmissionReport(
          reporterAddress,
          year,
          merkleRoot,
        );
      this.logger.log(
        `Successfully submitted report on-chain. TX: ${txHash}, ReportID: ${reportId}`,
      );

      const report = await this.prisma.$transaction(async (tx) => {
        const reportData = {
          year,
          totalEmissionsTco2e: totalEmissions,
          status: EmissionReportStatus.SUBMITTED,
          merkleRoot,
          blockchainTxHash: txHash,
          blockchainReportId: BigInt(reportId),
          companyId: company.id,
          sector,
        };
        const savedReport = existingReport
          ? await tx.emissionReport.update({
              where: { id: existingReport.id },
              data: {
                ...reportData,
                revisionNumber: { increment: 1 },
                auditedByUserId: null,
                auditedAt: null,
                auditorNotes: null,
                auditBlockchainTxHash: null,
                auditAnchorStatus: null,
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
            })
          : await tx.emissionReport.create({
              data: {
                ...reportData,
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

        await tx.emissionReportAuditEvent.create({
          data: {
            emissionReportId: savedReport.id,
            actorUserId: user.id,
            action: existingReport ? 'RESUBMITTED' : 'SUBMITTED',
            fromStatus: existingReport?.status ?? null,
            toStatus: EmissionReportStatus.SUBMITTED,
            merkleRoot,
          },
        });
        return savedReport;
      });
      await this.synchronizeCompanyCompliance(
        company.id,
        totalEmissions,
        quota.quotaTCO2e,
      );

      // Real-Time ML Anomaly & Physics Verification
      let auditResult: MlAuditResult | undefined = undefined;
      try {
        const prevReport = await this.prisma.emissionReport.findUnique({
          where: {
            companyId_year: {
              companyId: company.id,
              year: year - 1,
            },
          },
        });
        const historicalEmissionsTco2e = prevReport
          ? Number(prevReport.totalEmissionsTco2e)
          : undefined;

        const auditDto = ReportsMlAdapter.toAuditEmissionReportDto({
          sector,
          totalEmissions,
          historicalEmissionsTco2e,
        });

        auditResult =
          await this.mlAuditEngineService.evaluateEmissionReport(auditDto);

        if (auditResult && auditResult.isAnomaly) {
          await this.prisma.auditAnomaly.create({
            data: {
              companyId: company.id,
              facilityName: `${company.name} - Fasilitas Utama`,
              anomalyType: 'CEMS_ENERGY_CORRELATION',
              severity: auditResult.anomalyScore > 0.8 ? 'CRITICAL' : 'HIGH',
              anomalyScore: new Prisma.Decimal(auditResult.anomalyScore),
              reportedEmissionTco2e: new Prisma.Decimal(totalEmissions),
              expectedEmissionTco2e: new Prisma.Decimal(
                auditResult.expectedEmissionTco2e,
              ),
              divergencePercent: new Prisma.Decimal(
                auditResult.divergencePercent,
              ),
              detectedDate: new Date(),
              auditStatus: 'PENDING_REVIEW',
              verifierNotes: auditResult.explanation,
            },
          });
        }

        if (auditResult) {
          await this.prisma.emissionReport.update({
            where: { id: report.id },
            data: {
              auditResult: auditResult as unknown as Prisma.InputJsonObject,
            },
          });
        }
      } catch (mlErr) {
        this.logger.warn(
          `ML Audit Engine evaluation non-blocking error: ${(mlErr as Error).message}`,
        );
      }

      return {
        id: report.id,
        year,
        merkleRoot,
        txHash,
        blockchainReportId: Number(reportId),
        auditResult,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to process report', error);
      if (error instanceof HttpException) throw error;
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
  ): Promise<ReportSubmissionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: true },
    });
    if (!user) throw new BadRequestException('User not found');
    const company = user.companies[0];
    if (!company) throw new BadRequestException('User has no company');
    const reporterAddress = this.resolveEmitterWallet(user);
    const quota = await this.ptbaeService.resolveForCompany(company.id, year);

    const existingReport = await this.prisma.emissionReport.findUnique({
      where: {
        companyId_year: {
          companyId: company.id,
          year: year,
        },
      },
    });
    if (
      existingReport &&
      existingReport.status !== EmissionReportStatus.REVISION_REQUIRED
    ) {
      throw new ConflictException(
        `Laporan emisi untuk tahun ${year} sudah dikirimkan dan belum dapat dikirim ulang.`,
      );
    }

    const normalizedCalculationData =
      this.calculationService.normalize(calculationData);
    const calculatedTotal =
      normalizedCalculationData.scope1 +
      normalizedCalculationData.scope2 +
      normalizedCalculationData.scope3;

    if (Math.abs(calculatedTotal - totalEmissions) > 0.0001) {
      this.logger.warn(
        `Ignoring client total ${totalEmissions}; server recalculated ${calculatedTotal}`,
      );
    }

    const reportMetadata = {
      year,
      totalEmissionsTCO2e: calculatedTotal,
      companyId: company.id,
      sector,
      calculationData: normalizedCalculationData,
    };

    const merkleRoot = generateMerkleRoot(reportMetadata);
    this.logger.log(
      `Generated Merkle Root for calculator year ${year}: ${merkleRoot}`,
    );

    try {
      const { txHash, reportId } =
        await this.blockchainService.submitEmissionReport(
          reporterAddress,
          year,
          merkleRoot,
        );
      this.logger.log(
        `Successfully submitted calculator report on-chain. TX: ${txHash}, ReportID: ${reportId}`,
      );

      const report = await this.prisma.$transaction(async (tx) => {
        const reportData = {
          year,
          totalEmissionsTco2e: calculatedTotal,
          status: EmissionReportStatus.SUBMITTED,
          reportMethod: 'CALCULATOR' as const,
          sector,
          calculationData: normalizedCalculationData,
          merkleRoot,
          blockchainTxHash: txHash,
          blockchainReportId: BigInt(reportId),
          companyId: company.id,
        };
        const savedReport = existingReport
          ? await tx.emissionReport.update({
              where: { id: existingReport.id },
              data: {
                ...reportData,
                revisionNumber: { increment: 1 },
                auditedByUserId: null,
                auditedAt: null,
                auditorNotes: null,
                auditBlockchainTxHash: null,
                auditAnchorStatus: null,
              },
            })
          : await tx.emissionReport.create({ data: reportData });

        await tx.emissionReportAuditEvent.create({
          data: {
            emissionReportId: savedReport.id,
            actorUserId: user.id,
            action: existingReport ? 'RESUBMITTED' : 'SUBMITTED',
            fromStatus: existingReport?.status ?? null,
            toStatus: EmissionReportStatus.SUBMITTED,
            merkleRoot,
          },
        });
        return savedReport;
      });
      await this.synchronizeCompanyCompliance(
        company.id,
        calculatedTotal,
        quota.quotaTCO2e,
      );

      // Real-Time ML Anomaly & Physics Verification
      let auditResult: MlAuditResult | undefined = undefined;
      try {
        const prevReport = await this.prisma.emissionReport.findUnique({
          where: {
            companyId_year: {
              companyId: company.id,
              year: year - 1,
            },
          },
        });
        const historicalEmissionsTco2e = prevReport
          ? Number(prevReport.totalEmissionsTco2e)
          : undefined;

        const companyRecord = company as {
          productionCapacityTonnes?: number | string | null;
        };
        const companyProductionCapacity = companyRecord.productionCapacityTonnes
          ? Number(companyRecord.productionCapacityTonnes)
          : undefined;

        const auditDto = ReportsMlAdapter.toAuditEmissionReportDto({
          sector,
          totalEmissions: Math.min(totalEmissions, calculatedTotal),
          calculationData: normalizedCalculationData,
          historicalEmissionsTco2e,
          companyProductionCapacity,
        });

        auditResult =
          await this.mlAuditEngineService.evaluateEmissionReport(auditDto);

        if (auditResult && auditResult.isAnomaly) {
          await this.prisma.auditAnomaly.create({
            data: {
              companyId: company.id,
              facilityName: `${company.name} - Fasilitas Utama`,
              anomalyType: 'CEMS_ENERGY_CORRELATION',
              severity: auditResult.anomalyScore > 0.8 ? 'CRITICAL' : 'HIGH',
              anomalyScore: new Prisma.Decimal(auditResult.anomalyScore),
              reportedEmissionTco2e: new Prisma.Decimal(calculatedTotal),
              expectedEmissionTco2e: new Prisma.Decimal(
                auditResult.expectedEmissionTco2e,
              ),
              divergencePercent: new Prisma.Decimal(
                auditResult.divergencePercent,
              ),
              detectedDate: new Date(),
              auditStatus: 'PENDING_REVIEW',
              verifierNotes: auditResult.explanation,
            },
          });
        }

        if (auditResult) {
          await this.prisma.emissionReport.update({
            where: { id: report.id },
            data: {
              auditResult: auditResult as unknown as Prisma.InputJsonObject,
              calculationData: {
                ...normalizedCalculationData,
                auditResult: auditResult as unknown as Prisma.InputJsonObject,
              },
            },
          });
        }
      } catch (mlErr) {
        this.logger.warn(
          `ML Audit Engine evaluation non-blocking error: ${(mlErr as Error).message}`,
        );
      }

      return {
        id: report.id,
        year,
        merkleRoot,
        txHash,
        blockchainReportId: Number(reportId),
        auditResult,
      };
    } catch (error: unknown) {
      this.logger.error('Failed to process calculator report', error);
      if (error instanceof HttpException) throw error;
      const e = error as Record<string, unknown>;
      const errMsg = typeof e?.message === 'string' ? e.message : String(error);
      throw new InternalServerErrorException(
        'Failed to process calculator report: ' + errMsg,
      );
    }
  }
}
