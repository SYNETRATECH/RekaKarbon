import type { Company } from '../types';
import { COMPANIES_DATA } from '../lib/mock/companies';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface CompanyRepository {
  getCompanies(): Promise<Company[]>;
  getCompanyById(id: string): Promise<Company | null>;
}

class MockCompanyRepository implements CompanyRepository {
  async getCompanies(): Promise<Company[]> {
    return COMPANIES_DATA;
  }
  async getCompanyById(id: string): Promise<Company | null> {
    return COMPANIES_DATA.find((c) => c.id === id) ?? null;
  }
}

class ApiCompanyRepository implements CompanyRepository {
  async getCompanies(): Promise<Company[]> {
    return api.get<Company[]>('/companies');
  }
  async getCompanyById(id: string): Promise<Company | null> {
    return api.get<Company>(`/companies/${id}`);
  }
}

export const companyRepository: CompanyRepository = useMock
  ? new MockCompanyRepository()
  : new ApiCompanyRepository();
