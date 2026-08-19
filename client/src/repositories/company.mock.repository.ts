import type { CompanyRepository } from './company.repository';
import type { Company } from '../types';
import { COMPANIES_DATA } from '../lib/mock/companies';

export class MockCompanyRepository implements CompanyRepository {
  async getCompanies(): Promise<Company[]> {
    return COMPANIES_DATA;
  }
  async getCompanyById(id: string): Promise<Company | null> {
    return COMPANIES_DATA.find((c) => c.id === id) ?? null;
  }
}
