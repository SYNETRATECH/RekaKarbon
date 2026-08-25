import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { InternalServerErrorException } from '@nestjs/common';
import { ethers } from 'ethers';

jest.mock('ethers', () => {
  const original = jest.requireActual('ethers') as unknown as typeof import('ethers');
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
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit without env configuration', () => {
    it('should fail initialization gracefully if env vars are missing', () => {
      delete process.env.BESU_RPC_URL;
      delete process.env.PRIVATE_KEY;
      delete process.env.CARBON_TOKEN_CONTRACT_ADDRESS;
      delete process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS;

      service.onModuleInit();
      expect(ethers.JsonRpcProvider).not.toHaveBeenCalled();
    });
  });

  describe('with env configuration', () => {
    let mockContract: any;

    beforeEach(() => {
      process.env.BESU_RPC_URL = 'http://127.0.0.1:8545';
      process.env.PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      process.env.CARBON_TOKEN_CONTRACT_ADDRESS = '0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0';
      process.env.EMISSION_REGISTRY_CONTRACT_ADDRESS = '0x9DdaF0CD259887258Bc13a92C0a6dA92698644C1';

      mockContract = {
        balanceOf: jest.fn().mockResolvedValue(BigInt(150)),
        mintOffsetCredit: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ hash: '0xtesttxhash' }),
        }),
      };

      jest.mocked(ethers.JsonRpcProvider).mockImplementation(() => ({}) as any);
      jest.mocked(ethers.Wallet).mockImplementation(() => ({}) as any);
      jest.mocked(ethers.Contract).mockImplementation(() => mockContract as any);

      service.onModuleInit();
    });

    it('should initialize providers and contracts when env is present', () => {
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith('http://127.0.0.1:8545');
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
      const balance = await service.getCarbonBalance('0xaddress', 1);
      expect(balance).toBe(150);
      expect(mockContract.balanceOf).toHaveBeenCalledWith('0xaddress', 1);
    });

    it('should mint offset credit and return tx hash', async () => {
      const hash = await service.mintOffsetCredit('0xtoaddress', 500, '-6.2,106.8');
      expect(hash).toBe('0xtesttxhash');
      expect(mockContract.mintOffsetCredit).toHaveBeenCalledWith(
        '0xtoaddress',
        500,
        '-6.2,106.8',
        { gasPrice: 0 }
      );
    });
  });
});
