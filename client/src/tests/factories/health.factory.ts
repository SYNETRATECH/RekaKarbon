import { fakeDateTimeString } from './domain-generators';
import type { HealthStatusResponseType } from '../../schemas';

export function createMockSystemHealth(
  overrides?: Partial<HealthStatusResponseType>
): HealthStatusResponseType {
  return {
    status: overrides?.status ?? 'ok',
    uptimeSeconds: overrides?.uptimeSeconds ?? 3600,
    timestamp: overrides?.timestamp ?? fakeDateTimeString(),
    environment: overrides?.environment ?? 'development',
    services: overrides?.services ?? {
      database: { status: 'connected', latencyMs: 2.1 },
      blockchain: {
        status: 'synced',
        network: 'Hyperledger Besu (IBFT 2.0)',
        latestBlock: 12480,
        chainId: 1337,
      },
      storage: { status: 'operational' },
    },
    ...overrides,
  };
}
