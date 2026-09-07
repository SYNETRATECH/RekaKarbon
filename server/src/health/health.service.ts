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

    const blockchainHealth = this.blockchainService
      ? await this.blockchainService.getHealth()
      : null;
    const blockchainStatus =
      blockchainHealth?.status === 'ready' ? 'synced' : 'unreachable';
    const blockchainLatestBlock = this.blockchainService
      ? await this.blockchainService.getLatestBlockNumber()
      : null;
    const blockchainChainId =
      blockchainHealth?.connectedChainId ??
      blockchainHealth?.configuredChainId ??
      Number(process.env.BESU_CHAIN_ID || '1338');
    const overallStatus =
      dbStatus === 'connected' && blockchainStatus === 'synced'
        ? 'ok'
        : 'degraded';

    return {
      status: overallStatus as 'ok' | 'degraded' | 'error',
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
          status: blockchainStatus,
          network: blockchainHealth?.network || 'Besu Network Standby',
          latestBlock: blockchainLatestBlock ?? 0,
          chainId: Number.isInteger(blockchainChainId)
            ? blockchainChainId
            : 1338,
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
