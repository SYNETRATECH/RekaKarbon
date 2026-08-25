import { api } from '../lib/api';
import { WalletTransaction } from '../types/wallet.types';

export interface WalletRepository {
  getBalance(): Promise<number>;
  deposit(amount: number): Promise<{ invoiceUrl: string }>;
  getHistory(): Promise<WalletTransaction[]>;
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
}

export class MockWalletRepository implements WalletRepository {
  async getBalance(): Promise<number> {
    return Promise.resolve(50000000); // 50 Juta IDR mock
  }

  async deposit(amount: number): Promise<{ invoiceUrl: string }> {
    return Promise.resolve({ invoiceUrl: 'https://checkout-staging.xendit.co/web/mock-invoice' });
  }

  async getHistory(): Promise<WalletTransaction[]> {
    return Promise.resolve([
      {
        id: 'mock-1',
        type: 'DEPOSIT',
        title: 'Top-up Xendit',
        amount: 50000000,
        date: new Date().toISOString(),
        status: 'SUCCESS',
      },
    ]);
  }
}

export const walletRepository: WalletRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockWalletRepository()
    : new ApiWalletRepository();
