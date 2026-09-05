import { BursaController } from '../../src/bursa/bursa.controller';
import { BursaService } from '../../src/bursa/bursa.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
  getResponseError,
} from '../../src/common/testing/contract-test-harness';
import {
  BursaItemSchema,
  BursaPurchaseEligibilitySchema,
} from '../../../client/src/schemas';
import {
  createMockBursaItem,
  createMockPurchaseEligibility,
  seedFaker,
} from '../factories';
import { z } from 'zod';

describe('Bursa DEX Marketplace API Contract Test', () => {
  let harness: ContractTestHarness;

  beforeAll(() => {
    seedFaker();
  });

  const mockBursaItem = createMockBursaItem({
    id: 'b1c2d3e4-0001-4000-8000-000000000001',
    name: 'Restorasi Mangrove Teluk Benoa',
    pricePerTonIDR: 260000,
    volumeAvailableTCO2e: 4500,
  });

  const mockEligibility = createMockPurchaseEligibility({
    canPurchase: true,
    approvedEmissionsTCO2e: 17330,
    ptbaeQuotaTCO2e: 15000,
  });

  const mockBursaService = {
    getBursaItems: jest.fn().mockResolvedValue([mockBursaItem]),
    getPurchaseEligibility: jest.fn().mockResolvedValue(mockEligibility),
    buyCarbonToken: jest.fn().mockResolvedValue({
      txHash: '0x8a1c94857102948571029485710294857102948571029485',
      orderId: 'o1e2f3a4-0001-4000-8000-000000000001',
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [BursaController],
      providers: [{ provide: BursaService, useValue: mockBursaService }],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /emitter/bursa returns items matching BursaItemSchema', async () => {
    const res = await harness.http.get('/emitter/bursa').expect(200);
    const list = expectContract(res.body, z.array(BursaItemSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockBursaItem.id);
    expect(list[0].category).toBe('mangrove');
  });

  it('GET /emitter/bursa/eligibility satisfies BursaPurchaseEligibilitySchema', async () => {
    const res = await harness.http
      .get('/emitter/bursa/eligibility')
      .expect(200);
    const eligibility = expectContract(
      res.body,
      BursaPurchaseEligibilitySchema,
    );
    expect(eligibility.canPurchase).toBe(true);
    expect(eligibility.reason).toBe('eligible');
    expect(eligibility.complianceYear).toBe(2026);
  });

  it('POST /emitter/bursa/buy returns transaction hash response on successful order', async () => {
    const res = await harness.http
      .post('/emitter/bursa/buy')
      .send({ listingId: mockBursaItem.id, volumeTCO2e: 100 })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.txHash).toBeDefined();
  });

  it('POST /emitter/bursa/buy rejects invalid volume payload with 400 Bad Request', async () => {
    const res = await harness.http
      .post('/emitter/bursa/buy')
      .send({ listingId: mockBursaItem.id, volumeTCO2e: -50 })
      .expect(400);

    const err = getResponseError(res);
    expect(err.success).toBe(false);
  });
});
