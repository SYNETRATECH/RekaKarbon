import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WalletDepositStatus, WalletLedgerEntryType } from '@prisma/client';
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

      this.logger.log(
        `Processing deposit for ${externalId}, minting ${deposit.tokenAmount.toString()} RKB_CREDIT to ${deposit.walletAddress}`,
      );
      const txHash = await this.blockchainService.mintWalletCredit(
        deposit.walletAddress,
        Number(deposit.tokenAmount),
      );
      this.logger.log(`✅ Successfully minted RKB_CREDIT. txHash: ${txHash}`);

      await this.prisma.$transaction(async (tx) => {
        await tx.walletDeposit.update({
          where: { id: deposit.id },
          data: {
            status: WalletDepositStatus.SETTLED,
            blockchainTxHash: txHash,
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

      return txHash;
    } catch (error) {
      await this.prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: WalletDepositStatus.FAILED_RETRYABLE,
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
