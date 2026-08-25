export interface BursaItem {
  id: string;
  name: string;
  verified: boolean;
  category: 'mangrove' | 'hutan' | 'gambut';
  categoryLabel: string;
  location: string;
  priceFraction: number;
  change24h: number;
  supplyFractions: number;
  supplyPercent: number;
}
