import { HealthController } from '../../src/health/health.controller';
import { HealthService } from '../../src/health/health.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
  getResponseBody,
} from '../../src/common/testing/contract-test-harness';
import { HealthStatusResponseSchema } from '../../../client/src/schemas';
import { createMockSystemHealth } from '../factories';

describe('Health & Probes API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockHealthService = {
    getSystemHealth: jest.fn().mockResolvedValue(createMockSystemHealth()),
    getDatabaseHealth: jest.fn().mockResolvedValue({
      status: 'healthy',
      database: 'PostgreSQL (Prisma)',
    }),
    getBlockchainHealth: jest.fn().mockResolvedValue({
      status: 'synced',
      network: 'Hyperledger Besu',
      latestBlock: 12480,
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /health satisfies client HealthStatusResponseSchema and ApiResponse envelope', async () => {
    const res = await harness.http.get('/health').expect(200);
    const body = getResponseBody(res);
    expect(body.success).toBe(true);

    const validated = expectContract(res.body, HealthStatusResponseSchema);
    expect(validated.status).toBe('ok');
    expect(validated.services.database.status).toBe('connected');
    expect(validated.services.blockchain.network).toContain('Besu');
  });

  it('GET /health/db returns database probe response envelope', async () => {
    const res = await harness.http.get('/health/db').expect(200);
    const body = getResponseBody<{ status: string; database: string }>(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
  });

  it('GET /health/blockchain returns blockchain node probe response envelope', async () => {
    const res = await harness.http.get('/health/blockchain').expect(200);
    const body = getResponseBody<{ status: string; network: string }>(res);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('synced');
  });
});
