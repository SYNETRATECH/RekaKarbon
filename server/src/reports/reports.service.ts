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

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
    private readonly storageService: StorageService,
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

    return reports.map((r) => {
      const actual = Number(r.totalEmissionsTco2e);
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
        sectors: [
          {
            id: `sec-${r.id}-1`,
            name: 'Pembakaran Bahan Bakar Langsung (Scope 1)',
            scope: 'Scope 1',
            emissionsTCO2e: Math.round(actual * 0.75),
            percentage: 75,
            description: 'Emisi dari cerobong pembakaran batu bara / gas',
            color: '#10b981',
          },
        ],
      };
    });
  }

  private generateMerkleRoot(dataObj: Record<string, any>): string {
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
    totalEmissions: number,
    files: Express.Multer.File[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: true },
    });
    if (!user) throw new BadRequestException('User not found');
    const company = user.companies[0];
    if (!company) throw new BadRequestException('User has no company');

    const existingReport = await this.prisma.emissionReport.findUnique({
      where: {
        companyId_year: {
          companyId: company.id,
          year: year,
        }
      }
    });
    if (existingReport) {
      throw new BadRequestException(`Laporan emisi untuk tahun ${year} sudah pernah dikirimkan oleh perusahaan Anda.`);
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
}
