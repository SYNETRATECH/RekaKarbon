import type { HealthStatusResponse } from '../types/health';
import type { HealthRepository } from './health.repository';

export class MockHealthRepository implements HealthRepository {
  async getHealthStatus(): Promise<HealthStatusResponse> {
    return Promise.resolve({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 3600,
      environment: 'development',
      services: {
        database: {
          status: 'connected',
          latencyMs: 4.2,
        },
        blockchain: {
          status: 'synced',
          network: 'Hyperledger Besu (IBFT 2.0)',
          latestBlock: 12480,
          chainId: 1337,
        },
        storage: {
          status: 'operational',
        },
      },
    });
  }
}
