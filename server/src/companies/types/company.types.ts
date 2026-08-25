export interface Company {
  id: string;
  name: string;
  sector: string;
  region: string;
  center: [number, number];
  zoom: number;
  emissionCap: number;
  actualEmission: number;
  carbonDeficit: number;
  paymentStatus: 'unpaid' | 'paid';
  offsetCostIDR: number;
  auditDate: string;
  paymentDeadline?: string;
  paymentDate?: string;
  stackSensors: string;
  complianceRating: 'non_compliant' | 'warning' | 'compliant';
  recommendedPartner: string;
  picAuditor: string;
  description: string;
  originalCarbonDeficit?: number;
  originalOffsetCostIDR?: number;
}
