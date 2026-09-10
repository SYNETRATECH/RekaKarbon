import { api } from '../lib/api';
import { WalletTransaction } from '../types/wallet.types';
import {
  WalletLinkChallengeSchema,
  WalletLinkResultSchema,
  type WalletLinkChallengeType,
  type WalletLinkResultType,
} from '../schemas/wallet.schema';

export interface WalletLinkInput {
  challengeId: string;
  walletAddress: string;
  signature: string;
}

export interface WalletRepository {
  getBalance(): Promise<number>;
  deposit(amount: number): Promise<{ invoiceUrl: string }>;
  getHistory(): Promise<WalletTransaction[]>;
  createWalletLinkChallenge(walletAddress: string): Promise<WalletLinkChallengeType>;
  linkWallet(input: WalletLinkInput): Promise<WalletLinkResultType>;
}

export class ApiWalletRepository implements WalletRepository {
  async getBalance(): Promise<number> {
    const res = await api.get<{ balance: number }>('/emitter/wallet/balance');
    return res.balance;
  }

  async getHistory(): Promise<WalletTransaction[]> {
    return api.get<WalletTransaction[]>('/emitter/wallet/history');
  }

  async deposit(amount: number): Promise<{ invoiceUrl: string }> {
    return api.post<{ invoiceUrl: string }>('/emitter/wallet/deposit', { amountIDR: amount });
  }

  async createWalletLinkChallenge(walletAddress: string): Promise<WalletLinkChallengeType> {
    return api.post<WalletLinkChallengeType>(
      '/emitter/wallet/link/challenge',
      { walletAddress },
      WalletLinkChallengeSchema
    );
  }

  async linkWallet(input: WalletLinkInput): Promise<WalletLinkResultType> {
    return api.post<WalletLinkResultType>('/emitter/wallet/link', input, WalletLinkResultSchema);
  }
}

export class MockWalletRepository implements WalletRepository {
  async getBalance(): Promise<number> {
    return Promise.resolve(0);
  }

  async deposit(_amount: number): Promise<{ invoiceUrl: string }> {
    return Promise.resolve({ invoiceUrl: 'https://checkout-staging.xendit.co/web/mock-invoice' });
  }

  async getHistory(): Promise<WalletTransaction[]> {
    return Promise.resolve([]);
  }

  async createWalletLinkChallenge(_walletAddress: string): Promise<WalletLinkChallengeType> {
    throw new Error('Wallet linking tidak tersedia dalam mode mock.');
  }

  async linkWallet(_input: WalletLinkInput): Promise<WalletLinkResultType> {
    throw new Error('Wallet linking tidak tersedia dalam mode mock.');
  }
}

export const walletRepository: WalletRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockWalletRepository()
    : new ApiWalletRepository();
