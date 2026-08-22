export interface CarbonTaxCalculation {
  companyId: string;
  companyName: string;
  npwp: string;
  actualEmissionTCO2e: number;
  quotaPTBAETCO2e: number;
  deficitTCO2e: number;
  taxRatePerTonIDR: number;
  totalTaxPayableIDR: number;
  governingRegulation: string;
  calculatedAt: string;
}

export interface StpDocument {
  id: string;
  stpDocNumber: string;
  companyId: string;
  companyName: string;
  npwp: string;
  taxYear: number;
  totalTaxDueIDR: number;
  dueDate: string;
  paymentStatus: 'unpaid' | 'paid' | 'overdue';
  issuedAt: string;
}

export interface CalculateTaxDto {
  companyId: string;
  actualEmissionTCO2e: number;
  quotaPTBAETCO2e: number;
  taxRatePerTonIDR?: number;
}

export interface IssueStpDto {
  companyId: string;
  taxYear: number;
  totalTaxDueIDR: number;
}
