import { fakeDateTimeString } from './domain-generators';
import type { HealthStatusResponse } from '../../../client/src/schemas';

export function createMockSystemHealth(
  overrides?: Partial<HealthStatusResponse>,
): HealthStatusResponse {
  return {
    status: overrides?.status ?? 'ok',
    service: overrides?.service ?? 'RekaKarbon Core Backend API',
    version: overrides?.version ?? '1.0.0',
    uptimeSeconds: overrides?.uptimeSeconds ?? 3600,
    timestamp: overrides?.timestamp ?? fakeDateTimeString(),
    environment: overrides?.environment ?? 'development',
    services: overrides?.services ?? {
      database: { status: 'connected', latencyMs: 2.1 },
      blockchain: {
        status: 'synced',
        network: 'Hyperledger Besu / EVM Private Network',
        latestBlock: 12480,
        chainId: 1338,
      },
      storage: { status: 'operational' },
    },
    memory: overrides?.memory ?? {
      heapUsedMB: 50.2,
      heapTotalMB: 80.5,
      rssMB: 110.0,
    },
    ...overrides,
  };
}
