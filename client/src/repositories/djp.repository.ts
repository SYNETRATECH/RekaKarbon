import { api } from '../lib/api';
import type { CarbonTaxCalculation, StpDocument, CalculateTaxDto, IssueStpDto } from '../types/tax';

export interface DjpRepository {
  calculateTax(data: CalculateTaxDto): Promise<CarbonTaxCalculation>;
  issueStp(data: IssueStpDto): Promise<StpDocument>;
  getTaxHistory(companyId: string): Promise<StpDocument[]>;
}

export class ApiDjpRepository implements DjpRepository {
  async calculateTax(data: CalculateTaxDto): Promise<CarbonTaxCalculation> {
    return api.post<CarbonTaxCalculation>('/integrations/djp/calculate-tax', data);
  }

  async issueStp(data: IssueStpDto): Promise<StpDocument> {
    return api.post<StpDocument>('/integrations/djp/issue-stp', data);
  }

  async getTaxHistory(companyId: string): Promise<StpDocument[]> {
    return api.get<StpDocument[]>(`/integrations/djp/history/${companyId}`);
  }
}

import { MockDjpRepository } from './djp.mock.repository';

export const djpRepository: DjpRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ? new MockDjpRepository() : new ApiDjpRepository();
