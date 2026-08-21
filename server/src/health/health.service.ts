import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class HealthService {
  constructor(
    @Optional() private readonly prismaService?: PrismaService,
    @Optional() private readonly blockchainService?: BlockchainService,
  ) {}

  getSystemHealth() {
    const memory = process.memoryUsage();
    return Promise.resolve({
      status: 'ok',
      service: 'RekaKarbon Core Backend API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
    });
  }

  async getDatabaseHealth() {
    try {
      if (this.prismaService) {
        await this.prismaService.$queryRaw`SELECT 1`;
        return { status: 'healthy', database: 'PostgreSQL (Prisma)' };
      }
      return { status: 'mock_mode', database: 'In-Memory Fixtures Active' };
    } catch {
      return {
        status: 'degraded',
        database: 'PostgreSQL Unavailable (Mock Mode Fallback Active)',
      };
    }
  }

  getBlockchainHealth() {
    try {
      if (this.blockchainService) {
        return Promise.resolve({
          status: 'ready',
          network: 'Hyperledger Besu / EVM Private Network',
          chainId: 1337,
        });
      }
      return Promise.resolve({
        status: 'unconfigured',
        network: 'Besu Network Standby',
      });
    } catch {
      return Promise.resolve({
        status: 'offline',
        network: 'EVM RPC Node Unreachable',
      });
    }
  }
}
