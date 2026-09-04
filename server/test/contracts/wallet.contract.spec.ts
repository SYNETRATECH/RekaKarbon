import { WalletController } from '../../src/wallet/wallet.controller';
import { WalletService } from '../../src/wallet/wallet.service';
import { UsersService } from '../../src/users/users.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  WalletBalanceResponseSchema,
  WalletTransactionSchema,
  CreateDepositResultSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('Wallet API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockWalletAddress = '0x1234567890abcdef1234567890abcdef12345678';

  const mockTransaction = {
    id: 'tx-001',
    type: 'DEPOSIT' as const,
    title: 'Top-up Xendit Saldo',
    amount: 50000000,
    date: '2026-02-14T08:00:00.000Z',
    status: 'SUCCESS' as const,
  };

  const mockUsersService = {
    findById: jest.fn().mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      walletAddress: mockWalletAddress,
    }),
  };

  const mockWalletService = {
    getBalance: jest.fn().mockResolvedValue(50000000),
    getHistory: jest.fn().mockResolvedValue([mockTransaction]),
    createDeposit: jest.fn().mockResolvedValue({
      invoiceUrl: 'https://checkout-staging.xendit.co/web/mock-invoice',
    }),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [WalletController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: WalletService, useValue: mockWalletService },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /emitter/wallet/balance returns WalletBalanceResponseSchema', async () => {
    const res = await harness.http.get('/emitter/wallet/balance').expect(200);
    const item = expectContract(res.body, WalletBalanceResponseSchema);
    expect(item.address).toBe(mockWalletAddress);
    expect(item.balance).toBe(50000000);
  });

  it('GET /emitter/wallet/history returns array of WalletTransactionSchema', async () => {
    const res = await harness.http.get('/emitter/wallet/history').expect(200);
    const list = expectContract(res.body, z.array(WalletTransactionSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].id).toBe(mockTransaction.id);
    expect(list[0].status).toBe('SUCCESS');
  });

  it('POST /emitter/wallet/deposit creates invoice adhering to CreateDepositResultSchema', async () => {
    const res = await harness.http
      .post('/emitter/wallet/deposit')
      .send({ amountIDR: 25000000 })
      .expect(201);
    const item = expectContract(res.body, CreateDepositResultSchema);
    expect(item.invoiceUrl).toContain('checkout-staging.xendit.co');
  });
});
