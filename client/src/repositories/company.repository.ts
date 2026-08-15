import { COMPANIES_DATA } from '../lib/mock/companies';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface CompanyRepository {
  getCompanies(): Promise<any[]>;
  getCompanyById(id: string): Promise<any | null>;
}

class MockCompanyRepository implements CompanyRepository {
  async getCompanies() {
    return COMPANIES_DATA;
  }
  async getCompanyById(id: string) {
    return COMPANIES_DATA.find((c: any) => c.id === id) ?? null;
  }
}

class ApiCompanyRepository implements CompanyRepository {
  async getCompanies() {
    return api.get<any[]>('/companies');
  }
  async getCompanyById(id: string) {
    return api.get<any>(`/companies/${id}`);
  }
}

export const companyRepository: CompanyRepository = useMock
  ? new MockCompanyRepository()
  : new ApiCompanyRepository();
