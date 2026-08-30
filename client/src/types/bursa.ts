export interface BursaItem {
  id: string;
  name: string;
  verified: boolean;
  category: 'mangrove' | 'hutan' | 'gambut';
  categoryLabel: string;
  location: string;
  pricePerTonIDR: number;
  change24h: number;
  volumeAvailableTCO2e: number;
  supplyPercent: number;
}
