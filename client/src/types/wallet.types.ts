export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'EXPENSE';
  title: string;
  amount: number;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}
