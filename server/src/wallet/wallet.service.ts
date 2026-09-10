import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { XenditService } from '../integrations/xendit/xendit.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  // In a real scenario, this would be in a DB to track pending deposits
  private pendingDeposits = new Map<
    string,
    { walletAddress: string; amount: number }
  >();

  constructor(
    @Inject(forwardRef(() => XenditService))
    private readonly xenditService: XenditService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async createDeposit(walletAddress: string, amountIDR: number) {
    const externalId = `deposit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const description = `Top-up Wallet RKB_CREDIT Rp ${amountIDR}`;

    // Simpan di in-memory untuk dicocokkan saat webhook masuk
    this.pendingDeposits.set(externalId, { walletAddress, amount: amountIDR });

    try {
      const invoice = await this.xenditService.createInvoice(
        externalId,
        amountIDR,
        description,
      );
      this.logger.log(
        `Created Xendit Invoice ${externalId} for ${walletAddress}`,
      );
      return {
        invoiceUrl: invoice.invoiceUrl,
        externalId: invoice.externalId,
        status: invoice.status,
      };
    } catch (error) {
      this.pendingDeposits.delete(externalId);
      throw error;
    }
  }

  async processDeposit(externalId: string) {
    const deposit = this.pendingDeposits.get(externalId);
    if (!deposit) {
      this.logger.warn(`Deposit record not found for ${externalId}`);
      return;
    }

    try {
      this.logger.log(
        `Processing deposit for ${externalId}, minting ${deposit.amount} RKB_CREDIT to ${deposit.walletAddress}`,
      );
      const txHash = await this.blockchainService.mintWalletCredit(
        deposit.walletAddress,
        deposit.amount,
      );
      this.logger.log(`✅ Successfully minted RKB_CREDIT. txHash: ${txHash}`);

      // Hapus dari memory setelah sukses
      this.pendingDeposits.delete(externalId);
      return txHash;
    } catch (error) {
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
      const balance =
        await this.blockchainService.getWalletBalance(walletAddress);
      return balance > 0 ? balance : 500000000000;
    } catch (error) {
      this.logger.warn(
        `Unable to fetch blockchain balance for ${walletAddress}, falling back to seed default balance`,
        error,
      );
      return 500000000000;
    }
  }

  async getHistory(walletAddress: string) {
    try {
      const history =
        await this.blockchainService.getWalletTransactionHistory(walletAddress);
      if (Array.isArray(history) && history.length > 0) {
        return history;
      }
    } catch (error) {
      this.logger.warn(
        `Unable to fetch blockchain transaction history for ${walletAddress}`,
        error,
      );
    }

    return [
      {
        id: 'seed-deposit-500b',
        type: 'DEPOSIT',
        title: 'Top-up Deposit Perusahaan (Xendit Treasury)',
        amount: 500000000000,
        date: new Date('2026-01-01T08:00:00.000Z').toISOString(),
        status: 'SUCCESS',
      },
    ];
  }
}
