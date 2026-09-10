import { ConflictException } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';
import { XenditService } from '../integrations/xendit/xendit.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { WalletService } from './wallet.service';

describe('WalletService wallet linking', () => {
  const userId = '00000000-0000-4000-8000-000000000001';

  function createService(prisma: PrismaService): WalletService {
    return new WalletService(
      {} as XenditService,
      {} as BlockchainService,
      prisma,
    );
  }

  it('creates a short-lived challenge bound to the requested wallet', async () => {
    const wallet = ethers.Wallet.createRandom();
    const challenge = {
      id: '00000000-0000-4000-8000-000000000002',
      nonce: 'nonce-1',
      message: 'RekaKarbon Wallet Link',
      expiresAt: new Date('2026-09-10T12:05:00.000Z'),
    };
    const createChallenge = jest.fn().mockResolvedValue(challenge);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          walletAddress: null,
        }),
      },
      walletLinkChallenge: {
        create: createChallenge,
      },
    } as unknown as PrismaService;
    const service = createService(prisma);

    const result = await service.createWalletLinkChallenge(
      userId,
      wallet.address,
    );

    expect(result).toEqual({
      challengeId: challenge.id,
      nonce: challenge.nonce,
      message: challenge.message,
      expiresAt: challenge.expiresAt.toISOString(),
    });
    expect(createChallenge).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        walletAddress: wallet.address,
        nonce: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('links a wallet when the signature matches the challenge', async () => {
    const wallet = ethers.Wallet.createRandom();
    const message = 'RekaKarbon Wallet Link\nNonce: nonce-2';
    const signature = await wallet.signMessage(message);
    const challenge = {
      id: '00000000-0000-4000-8000-000000000003',
      userId,
      walletAddress: wallet.address,
      message,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
    };
    const tx = {
      walletLinkChallenge: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ walletAddress: null }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      walletLinkChallenge: {
        findUnique: jest.fn().mockResolvedValue(challenge),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          async (callback: (transaction: typeof tx) => Promise<unknown>) =>
            callback(tx),
        ),
    } as unknown as PrismaService;
    const service = createService(prisma);

    const result = await service.linkWallet(
      userId,
      challenge.id,
      wallet.address,
      signature,
    );

    expect(result.address).toBe(wallet.address);
    expect(tx.walletLinkChallenge.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: challenge.id,
        userId,
        consumedAt: null,
      }),
      data: expect.objectContaining({ consumedAt: expect.any(Date) }),
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { walletAddress: wallet.address },
    });
  });

  it('rejects a challenge replay', async () => {
    const wallet = ethers.Wallet.createRandom();
    const message = 'RekaKarbon Wallet Link\nNonce: nonce-3';
    const signature = await wallet.signMessage(message);
    const challenge = {
      id: '00000000-0000-4000-8000-000000000004',
      userId,
      walletAddress: wallet.address,
      message,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: new Date(),
    };
    const prisma = {
      walletLinkChallenge: {
        findUnique: jest.fn().mockResolvedValue(challenge),
      },
    } as unknown as PrismaService;
    const service = createService(prisma);

    await expect(
      service.linkWallet(userId, challenge.id, wallet.address, signature),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
