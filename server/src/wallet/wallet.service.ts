import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  ConflictException,
  Inject,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  BlockchainOperationStatus,
  BlockchainOperationType,
  WalletDepositStatus,
  WalletLedgerEntryType,
} from '@prisma/client';
import { ethers } from 'ethers';
import { XenditService } from '../integrations/xendit/xendit.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @Inject(forwardRef(() => XenditService))
    private readonly xenditService: XenditService,
    private readonly blockchainService: BlockchainService,
    private readonly prisma: PrismaService,
  ) {}

  async createWalletLinkChallenge(userId: string, walletAddress: string) {
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(walletAddress);
    } catch {
      throw new BadRequestException('Alamat wallet tidak valid.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletAddress: true },
    });
    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    if (
      user.walletAddress &&
      ethers.getAddress(user.walletAddress) !== normalizedAddress
    ) {
      throw new ConflictException(
        'Akun sudah memiliki wallet berbeda. Hubungi administrator untuk menggantinya.',
      );
    }

    const nonce = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    const message = [
      'RekaKarbon Wallet Link',
      `Address: ${normalizedAddress}`,
      `User: ${userId}`,
      `Chain ID: ${this.getConfiguredChainId() ?? 1338}`,
      `Nonce: ${nonce}`,
      `Expires: ${expiresAt.toISOString()}`,
    ].join('\n');

    const challenge = await this.prisma.walletLinkChallenge.create({
      data: {
        userId,
        walletAddress: normalizedAddress,
        nonce,
        message,
        expiresAt,
      },
    });

    return {
      challengeId: challenge.id,
      nonce: challenge.nonce,
      message: challenge.message,
      expiresAt: challenge.expiresAt.toISOString(),
    };
  }

  async linkWallet(
    userId: string,
    challengeId: string,
    walletAddress: string,
    signature: string,
  ) {
    const challenge = await this.prisma.walletLinkChallenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge || challenge.userId !== userId) {
      throw new BadRequestException('Challenge wallet tidak ditemukan.');
    }
    if (challenge.consumedAt || challenge.expiresAt <= new Date()) {
      throw new ConflictException(
        'Challenge wallet sudah kedaluwarsa atau digunakan.',
      );
    }

    let normalizedAddress: string;
    let recoveredAddress: string;
    try {
      normalizedAddress = ethers.getAddress(walletAddress);
      recoveredAddress = ethers.getAddress(
        ethers.verifyMessage(challenge.message, signature),
      );
    } catch {
      throw new UnauthorizedException('Signature wallet tidak valid.');
    }

    if (
      challenge.walletAddress !== normalizedAddress ||
      recoveredAddress !== normalizedAddress
    ) {
      throw new UnauthorizedException(
        'Signature tidak cocok dengan alamat wallet challenge.',
      );
    }

    const now = new Date();
    try {
      return await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.walletLinkChallenge.updateMany({
          where: {
            id: challenge.id,
            userId,
            consumedAt: null,
            expiresAt: { gt: now },
          },
          data: { consumedAt: now },
        });
        if (claimed.count !== 1) {
          throw new ConflictException(
            'Challenge wallet sudah kedaluwarsa atau digunakan.',
          );
        }

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { walletAddress: true },
        });
        if (!user) {
          throw new NotFoundException('Pengguna tidak ditemukan.');
        }
        if (
          user.walletAddress &&
          ethers.getAddress(user.walletAddress) !== normalizedAddress
        ) {
          throw new ConflictException(
            'Akun sudah memiliki wallet berbeda. Hubungi administrator untuk menggantinya.',
          );
        }

        await tx.user.update({
          where: { id: userId },
          data: { walletAddress: normalizedAddress },
        });

        return {
          address: normalizedAddress,
          linkedAt: now.toISOString(),
        };
      });
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Failed to persist linked wallet', error);
      throw new InternalServerErrorException(
        'Wallet berhasil diverifikasi tetapi gagal disimpan.',
      );
    }
  }

  async createDeposit(
    userId: string,
    walletAddress: string,
    amountIDR: number,
  ) {
    if (!Number.isSafeInteger(amountIDR) || amountIDR < 10_000) {
      throw new BadRequestException(
        'Nominal deposit harus berupa bilangan bulat minimal Rp 10.000.',
      );
    }

    const externalId = `deposit-${randomUUID()}`;
    const description = `Top-up Wallet RKB_CREDIT Rp ${amountIDR}`;
    const tokenAmount = BigInt(Math.trunc(amountIDR));

    const deposit = await this.prisma.walletDeposit.create({
      data: {
        userId,
        walletAddress,
        externalId,
        amountIdr: amountIDR,
        tokenAmount,
        status: WalletDepositStatus.PAYMENT_PENDING,
      },
    });

    try {
      const invoice = await this.xenditService.createInvoice(
        externalId,
        amountIDR,
        description,
      );
      await this.prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          invoiceUrl: invoice.invoiceUrl,
          providerStatus: invoice.status ? String(invoice.status) : null,
        },
      });
      this.logger.log(
        `Created Xendit Invoice ${externalId} for ${walletAddress}`,
      );
      return {
        invoiceUrl: invoice.invoiceUrl,
        externalId: invoice.externalId,
        status: invoice.status,
      };
    } catch (error) {
      await this.prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: WalletDepositStatus.FAILED_PERMANENT,
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  async processDeposit(externalId: string, providerEventId?: string) {
    const deposit = await this.prisma.walletDeposit.findUnique({
      where: { externalId },
    });
    if (!deposit) {
      this.logger.warn(`Deposit record not found for ${externalId}`);
      return;
    }

    if (deposit.status === WalletDepositStatus.SETTLED) {
      return deposit.blockchainTxHash ?? undefined;
    }

    const claimed = await this.prisma.walletDeposit.updateMany({
      where: {
        id: deposit.id,
        status: {
          in: [
            WalletDepositStatus.PAYMENT_PENDING,
            WalletDepositStatus.PAID,
            WalletDepositStatus.FAILED_RETRYABLE,
          ],
        },
      },
      data: {
        status: WalletDepositStatus.MINT_PENDING,
        providerStatus: 'PAID',
        ...(providerEventId ? { providerEventId } : {}),
        paidAt: deposit.paidAt ?? new Date(),
      },
    });

    if (claimed.count === 0) {
      const current = await this.prisma.walletDeposit.findUnique({
        where: { id: deposit.id },
      });
      return current?.blockchainTxHash ?? undefined;
    }

    let operationId: string | undefined;
    let submittedTxHash: string | undefined;
    let needsReconciliation = false;

    try {
      if (deposit.tokenAmount > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error('Deposit token amount exceeds supported precision');
      }

      await this.prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: WalletDepositStatus.ONCHAIN_SUBMITTED,
          submittedAt: new Date(),
        },
      });

      const operationIdempotencyKey = `wallet-deposit:${deposit.id}:mint`;
      const operation = await this.prisma.blockchainOperation.upsert({
        where: { idempotencyKey: operationIdempotencyKey },
        create: {
          operationType: BlockchainOperationType.WALLET_DEPOSIT_MINT,
          aggregateType: 'WalletDeposit',
          aggregateId: deposit.id,
          idempotencyKey: operationIdempotencyKey,
          chainId: this.getConfiguredChainId(),
          contractAddress:
            process.env.CARBON_TOKEN_CONTRACT_ADDRESS ?? undefined,
          functionName: 'mintWalletCredit',
          functionSelector: ethers
            .id('mintWalletCredit(address,uint256)')
            .slice(0, 10),
          payloadHash: ethers.keccak256(
            ethers.toUtf8Bytes(
              JSON.stringify({
                depositId: deposit.id,
                walletAddress: deposit.walletAddress,
                tokenAmount: deposit.tokenAmount.toString(),
              }),
            ),
          ),
          status: BlockchainOperationStatus.PENDING,
        },
        update: {},
      });
      operationId = operation.id;

      if (
        operation.status === BlockchainOperationStatus.CONFIRMED &&
        operation.transactionHash
      ) {
        submittedTxHash = operation.transactionHash;
      } else if (operation.status === BlockchainOperationStatus.SUBMITTED) {
        needsReconciliation = true;
        await this.prisma.walletDeposit.update({
          where: { id: deposit.id },
          data: {
            status: WalletDepositStatus.RECONCILIATION_REQUIRED,
            lastError:
              'Transaksi sebelumnya sudah dikirim tetapi receipt belum tersimpan.',
          },
        });
        throw new Error(
          'Existing wallet deposit transaction needs reconciliation',
        );
      }

      if (!submittedTxHash) {
        await this.prisma.blockchainOperation.update({
          where: { id: operation.id },
          data: {
            status: BlockchainOperationStatus.SUBMITTED,
            submittedAt: new Date(),
          },
        });

        this.logger.log(
          `Processing deposit for ${externalId}, minting ${deposit.tokenAmount.toString()} RKB_CREDIT to ${deposit.walletAddress}`,
        );
        submittedTxHash = await this.blockchainService.mintWalletCredit(
          deposit.walletAddress,
          Number(deposit.tokenAmount),
        );
        this.logger.log(
          `✅ Successfully minted RKB_CREDIT. txHash: ${submittedTxHash}`,
        );
      }

      await this.prisma.blockchainOperation.update({
        where: { id: operation.id },
        data: {
          status: BlockchainOperationStatus.CONFIRMED,
          transactionHash: submittedTxHash,
          confirmedAt: new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.walletDeposit.update({
          where: { id: deposit.id },
          data: {
            status: WalletDepositStatus.SETTLED,
            blockchainTxHash: submittedTxHash,
            confirmedAt: new Date(),
            lastError: null,
          },
        });

        await tx.walletLedgerEntry.upsert({
          where: { idempotencyKey: `deposit:${deposit.id}:credit` },
          create: {
            userId: deposit.userId,
            depositId: deposit.id,
            walletAddress: deposit.walletAddress,
            entryType: WalletLedgerEntryType.DEPOSIT_CREDIT,
            amountIdr: deposit.amountIdr,
            tokenAmount: deposit.tokenAmount,
            idempotencyKey: `deposit:${deposit.id}:credit`,
            reference: externalId,
            description:
              'Top-up Wallet RKB_CREDIT melalui pembayaran terverifikasi',
          },
          update: {},
        });
      });

      return submittedTxHash;
    } catch (error) {
      if (operationId && !submittedTxHash && !needsReconciliation) {
        await this.prisma.blockchainOperation.update({
          where: { id: operationId },
          data: {
            status: BlockchainOperationStatus.FAILED_RETRYABLE,
            retryCount: { increment: 1 },
            lastErrorCode: 'WALLET_DEPOSIT_MINT_FAILED',
            lastErrorMessage:
              error instanceof Error ? error.message : String(error),
            nextRetryAt: new Date(Date.now() + 60_000),
          },
        });
      }
      await this.prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status:
            submittedTxHash || needsReconciliation
              ? WalletDepositStatus.RECONCILIATION_REQUIRED
              : WalletDepositStatus.FAILED_RETRYABLE,
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
      this.logger.error(
        `Failed to mint wallet credit for ${externalId}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process blockchain transaction',
      );
    }
  }

  private getConfiguredChainId(): number | undefined {
    const value = Number(
      process.env.BESU_CHAIN_ID ?? process.env.QBFT_CHAIN_ID,
    );
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  }

  async getBalance(walletAddress: string) {
    try {
      return await this.blockchainService.getWalletBalance(walletAddress);
    } catch (error) {
      this.logger.warn(
        `Unable to fetch blockchain balance for ${walletAddress}`,
        error,
      );
      throw new InternalServerErrorException(
        'Saldo wallet tidak dapat dibaca dari blockchain',
      );
    }
  }

  async getHistory(walletAddress: string) {
    const deposits = await this.prisma.walletDeposit.findMany({
      where: { walletAddress },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const ledgerEntries = await this.prisma.walletLedgerEntry.findMany({
      where: { walletAddress },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const ledgerHistory = ledgerEntries.map((entry) => ({
      id: entry.id,
      type:
        entry.entryType === WalletLedgerEntryType.DEPOSIT_CREDIT
          ? 'DEPOSIT'
          : 'EXPENSE',
      title: entry.description ?? entry.entryType,
      amount: Number(entry.tokenAmount ?? 0n),
      date: entry.createdAt.toISOString(),
      status: 'SUCCESS',
    }));

    const settledDepositIds = new Set(
      ledgerEntries
        .map((entry) => entry.depositId)
        .filter((depositId): depositId is string => depositId !== null),
    );
    const pendingDepositHistory = deposits
      .filter((deposit) => !settledDepositIds.has(deposit.id))
      .map((deposit) => ({
        id: deposit.id,
        type: 'DEPOSIT' as const,
        title: 'Top-up Wallet melalui Xendit',
        amount: Number(deposit.tokenAmount),
        date: deposit.createdAt.toISOString(),
        status:
          deposit.status === WalletDepositStatus.FAILED_PERMANENT ||
          deposit.status === WalletDepositStatus.RECONCILIATION_REQUIRED
            ? ('FAILED' as const)
            : ('PENDING' as const),
      }));

    const persistedHistory = [...ledgerHistory, ...pendingDepositHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    try {
      const chainHistory =
        await this.blockchainService.getWalletTransactionHistory(walletAddress);
      const persistedTxHashes = new Set(
        deposits
          .map((deposit) => deposit.blockchainTxHash)
          .filter((txHash): txHash is string => txHash !== null),
      );
      return [...persistedHistory, ...chainHistory]
        .filter((entry) => !persistedTxHashes.has(entry.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 100);
    } catch (error) {
      if (persistedHistory.length > 0) {
        this.logger.warn(
          `Returning persisted wallet history because blockchain history is unavailable for ${walletAddress}`,
          error,
        );
        return persistedHistory;
      }
      this.logger.warn(
        `Unable to fetch blockchain transaction history for ${walletAddress}`,
        error,
      );
      throw new InternalServerErrorException(
        'Riwayat transaksi wallet tidak dapat dibaca',
      );
    }
  }
}
