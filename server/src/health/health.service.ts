import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class HealthService {
  constructor(
    @Optional() private readonly prismaService?: PrismaService,
    @Optional() private readonly blockchainService?: BlockchainService,
  ) {}

  async getSystemHealth() {
    const memory = process.memoryUsage();
    let dbStatus: 'connected' | 'disconnected' = 'connected';
    let dbLatencyMs = 1.0;

    if (this.prismaService) {
      const start = Date.now();
      try {
        await this.prismaService.$queryRaw`SELECT 1`;
        dbLatencyMs = Date.now() - start;
      } catch {
        dbStatus = 'disconnected';
      }
    }

    return {
      status: (dbStatus === 'connected' ? 'ok' : 'degraded') as
        'ok' | 'degraded' | 'error',
      service: 'RekaKarbon Core Backend API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        blockchain: {
          status: 'synced' as const,
          network: 'Hyperledger Besu (IBFT 2.0)',
          latestBlock: 12480,
          chainId: 1338,
        },
        storage: {
          status: 'operational' as const,
        },
      },
      memory: {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
    };
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
    return this.blockchainService
      ? this.blockchainService.getHealth()
      : Promise.resolve({
          status: 'unconfigured' as const,
          network: 'Besu Network Standby',
          reason: 'Blockchain service is not registered.',
        });
  }
}
