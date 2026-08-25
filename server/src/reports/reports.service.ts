import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { ethers } from 'ethers';
import type { EmissionReport } from './types';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async getEmissionReports(): Promise<EmissionReport[]> {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((c) => {
      const actual = Number(c.actualEmissionTco2e);

      return {
        id: c.id,
        year: 2026,
        title: `Laporan Emisi Tahunan ${c.name} 2026`,
        fileName: `Laporan_Emisi_${c.name.replace(/\s+/g, '_')}_2026.pdf`,
        fileSizeBytes: 2450000,
        uploadDate: c.auditDate ? c.auditDate.toISOString().split('T')[0] : '',
        status: 'verified',
        totalEmissionsTCO2e: actual,
        sectors: [
          {
            id: `sec-${c.id}-1`,
            name: 'Pembakaran Bahan Bakar Langsung (Scope 1)',
            scope: 'Scope 1',
            emissionsTCO2e: Math.round(actual * 0.75),
            percentage: 75,
            description: 'Emisi dari cerobong pembakaran batu bara / gas',
            color: '#10b981',
          },
          {
            id: `sec-${c.id}-2`,
            name: 'Konsumsi Listrik Grid PLN (Scope 2)',
            scope: 'Scope 2',
            emissionsTCO2e: Math.round(actual * 0.18),
            percentage: 18,
            description: 'Emisi tidak langsung dari konsumsi listrik',
            color: '#3b82f6',
          },
          {
            id: `sec-${c.id}-3`,
            name: 'Proses Fugitive & Limbah Operasional',
            scope: 'Scope 1',
            emissionsTCO2e: Math.round(actual * 0.07),
            percentage: 7,
            description: 'Emisi fugitive dari sistem pendingin dan flare',
            color: '#f59e0b',
          },
        ],
      };
    });
  }

  private generateMerkleRoot(dataString: string): string {
    try {
      const parsedData: unknown = JSON.parse(dataString);
      if (
        typeof parsedData !== 'object' ||
        parsedData === null ||
        Array.isArray(parsedData)
      ) {
        throw new Error('Report data must be a JSON object');
      }
      const dataObj = parsedData as Record<string, unknown>;
      const leaves = Object.keys(dataObj)
        .sort() // manual sorting as requested by user
        .map((key) =>
          ethers.keccak256(
            ethers.toUtf8Bytes(`${key}:${JSON.stringify(dataObj[key])}`),
          ),
        );

      let root = leaves.length > 0 ? leaves[0] : ethers.ZeroHash;
      for (let i = 1; i < leaves.length; i++) {
        // Sort pairs before hashing for consistency
        const pair = [root, leaves[i]].sort();
        root = ethers.keccak256(ethers.concat(pair));
      }
      return root;
    } catch {
      throw new BadRequestException('Invalid JSON report data');
    }
  }

  async submitReport(userId: string, year: number, reportData: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: true },
    });
    if (!user) throw new BadRequestException('User not found');

    // Generate Merkle Root
    const merkleRoot = this.generateMerkleRoot(reportData);
    this.logger.log(`Generated Merkle Root for year ${year}: ${merkleRoot}`);

    try {
      // 1. Submit to Blockchain (EmissionReportRegistry)
      const { txHash, reportId } =
        await this.blockchainService.submitEmissionReport(year, merkleRoot);
      this.logger.log(
        `Successfully submitted report on-chain. TX: ${txHash}, ReportID: ${reportId}`,
      );

      // 2. We can save this to DB if needed, but for now we return the on-chain reference
      return {
        year,
        merkleRoot,
        txHash,
        blockchainReportId: reportId,
      };
    } catch (error) {
      this.logger.error('Failed to submit report', error);
      throw new InternalServerErrorException(
        'Failed to process report on-chain',
      );
    }
  }
}
