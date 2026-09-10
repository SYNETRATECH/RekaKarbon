import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import {
  blockchainConfig,
  type BlockchainConfig,
} from './config/blockchain.config';
import { ethers } from 'ethers';
import type {
  BlockchainTransaction,
  CarbonTokenContract,
  EmissionRegistryContract,
} from './types';

jest.mock('ethers', () => {
  const original = jest.requireActual(
    'ethers',
  ) as unknown as typeof import('ethers');
  return {
    ...original,
    ethers: {
      ...original.ethers,
      JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
      Wallet: jest.fn().mockImplementation(() => ({})),
      Contract: jest.fn().mockImplementation(() => ({
        balanceOf: jest.fn().mockResolvedValue(BigInt(100)),
        mintOffsetCredit: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ hash: '0xmocktxhash' }),
        }),
      })),
    },
  };
});

describe('BlockchainService', () => {
  let service: BlockchainService;

  const defaultMockConfig: BlockchainConfig = {
    rpcUrl: 'http://127.0.0.1:8545',
    privateKey:
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    carbonTokenAddress: '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0',
    emissionRegistryAddress: '0x9DdaF0CD259887258Bc13a92C0a6dA92698644C1',
    chainId: 1338,
    reconciliationWorkerEnabled: true,
    reconciliationIntervalMs: 30000,
    reconciliationBatchSize: 20,
  };

  const createServiceWithConfig = async (
    config: Partial<BlockchainConfig> = {},
  ): Promise<BlockchainService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: blockchainConfig.KEY,
          useValue: { ...defaultMockConfig, ...config },
        },
      ],
    }).compile();

    return module.get<BlockchainService>(BlockchainService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service = await createServiceWithConfig();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit without complete configuration', () => {
    it('should fail initialization gracefully if config properties are missing', async () => {
      const incompleteService = await createServiceWithConfig({
        rpcUrl: undefined,
        privateKey: undefined,
        carbonTokenAddress: undefined,
        emissionRegistryAddress: undefined,
      });

      incompleteService.onModuleInit();
      expect(ethers.JsonRpcProvider).not.toHaveBeenCalled();
    });
  });

  describe('with valid configuration', () => {
    let mockContract: Pick<
      CarbonTokenContract,
      | 'balanceOf'
      | 'mintOffsetCredit'
      | 'mintWalletCredit'
      | 'MINISTRY_ROLE'
      | 'DEPOSIT_ROLE'
      | 'ORACLE_ROLE'
      | 'MARKET_OPERATOR_ROLE'
      | 'hasRole'
    > &
      Pick<
        EmissionRegistryContract,
        'submitReportFor' | 'AUDITOR_ROLE' | 'REPORTER_ROLE' | 'hasRole'
      >;

    beforeEach(() => {
      const transaction: BlockchainTransaction = {
        wait: jest.fn().mockResolvedValue({
          hash: '0xtesttxhash',
          logs: [],
        }),
      };
      mockContract = {
        balanceOf: jest.fn().mockResolvedValue(BigInt(150)),
        mintOffsetCredit: jest.fn().mockResolvedValue(transaction),
        mintWalletCredit: jest.fn().mockResolvedValue(transaction),
        MINISTRY_ROLE: jest.fn().mockResolvedValue('MINISTRY_ROLE'),
        DEPOSIT_ROLE: jest.fn().mockResolvedValue('DEPOSIT_ROLE'),
        ORACLE_ROLE: jest.fn().mockResolvedValue('ORACLE_ROLE'),
        MARKET_OPERATOR_ROLE: jest
          .fn()
          .mockResolvedValue('MARKET_OPERATOR_ROLE'),
        AUDITOR_ROLE: jest.fn().mockResolvedValue('AUDITOR_ROLE'),
        REPORTER_ROLE: jest.fn().mockResolvedValue('REPORTER_ROLE'),
        hasRole: jest.fn().mockResolvedValue(true),
        submitReportFor: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({
            hash: '0xreporttxhash',
            logs: [
              {
                fragment: { name: 'ReportSubmitted' },
                args: [7n],
              },
            ],
          }),
        }),
      };

      jest.mocked(ethers.JsonRpcProvider).mockImplementation(
        () =>
          ({
            getNetwork: jest.fn().mockResolvedValue({ chainId: 1338n }),
            getCode: jest.fn().mockResolvedValue('0x6000'),
            getBlockNumber: jest.fn().mockResolvedValue(42),
            getFeeData: jest.fn().mockResolvedValue({
              gasPrice: 1n,
              maxFeePerGas: null,
              maxPriorityFeePerGas: null,
            }),
          }) as unknown as ethers.JsonRpcProvider,
      );
      jest.mocked(ethers.Wallet).mockImplementation(
        () =>
          ({
            address: '0x0000000000000000000000000000000000000001',
          }) as unknown as ethers.Wallet,
      );
      jest
        .mocked(ethers.Contract)
        .mockImplementation(() => mockContract as unknown as ethers.Contract);

      service.onModuleInit();
    });

    it('should initialize providers and contracts when env is present', () => {
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(
        'http://127.0.0.1:8545',
        1338,
        { staticNetwork: false },
      );
      expect(ethers.Wallet).toHaveBeenCalledWith(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        expect.any(Object),
      );
      // RekaKarbon contract
      expect(ethers.Contract).toHaveBeenCalledWith(
        '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0',
        expect.any(Array),
        expect.any(Object),
      );
      // EmissionRegistry contract
      expect(ethers.Contract).toHaveBeenCalledWith(
        '0x9DdaF0CD259887258Bc13a92C0a6dA92698644C1',
        expect.any(Array),
        expect.any(Object),
      );
    });

    it('should read carbon balance', async () => {
      const walletAddress = '0x0000000000000000000000000000000000000001';
      const balance = await service.getCarbonBalance(walletAddress, 1);
      expect(balance).toBe(150);
      expect(mockContract.balanceOf).toHaveBeenCalledWith(walletAddress, 1);
    });

    it('should reject an invalid wallet address instead of using a fallback', async () => {
      await expect(
        service.getCarbonBalance('not-an-address', 3),
      ).rejects.toThrow('Wallet address must be a valid EVM address.');
      expect(mockContract.balanceOf).not.toHaveBeenCalled();
    });

    it('should mint offset credit and return tx hash', async () => {
      const hash = await service.mintOffsetCredit(
        '0xtoaddress',
        500,
        '-6.2,106.8',
      );
      expect(hash).toBe('0xtesttxhash');
      expect(mockContract.mintOffsetCredit).toHaveBeenCalledWith(
        '0xtoaddress',
        500,
        '-6.2,106.8',
        { gasPrice: 1n },
      );
    });

    it('should reject a reverted wallet credit transaction', async () => {
      mockContract.mintWalletCredit = jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          hash: '0xrevertedtxhash',
          logs: [],
          status: 0,
        }),
      });

      await expect(
        service.mintWalletCredit(
          '0x0000000000000000000000000000000000000001',
          100_000,
        ),
      ).rejects.toThrow('Failed to mint wallet credit');
    });

    it('should report a ready QBFT target only when contracts and signer roles are valid', async () => {
      await expect(service.getHealth()).resolves.toMatchObject({
        status: 'ready',
        configuredChainId: 1338,
        connectedChainId: 1338,
        contractDeployed: true,
        registryDeployed: true,
        latestBlockNumber: 42,
        ministryRoleGrantedToSigner: true,
        depositRoleGrantedToSigner: true,
        oracleRoleGrantedToSigner: true,
        marketOperatorRoleGrantedToSigner: true,
        auditorRoleGrantedToSigner: true,
        reporterRoleGrantedToSigner: true,
      });
    });

    it('should submit an emission report for the emitter wallet', async () => {
      const result = await service.submitEmissionReport(
        '0x0000000000000000000000000000000000000002',
        2026,
        '0x0000000000000000000000000000000000000000000000000000000000000003',
      );

      expect(result).toEqual({
        txHash: '0xreporttxhash',
        reportId: 7,
      });
      expect(mockContract.submitReportFor).toHaveBeenCalledWith(
        '0x0000000000000000000000000000000000000002',
        2026,
        '0x0000000000000000000000000000000000000000000000000000000000000003',
        { gasPrice: 1n },
      );
    });
  });
});
