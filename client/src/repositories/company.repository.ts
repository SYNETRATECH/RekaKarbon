import type { Company } from '../types';
import { CompanySchema } from '../schemas';
import { z } from 'zod';
import { api } from '../lib/api';

export interface CompanyRepository {
  getCompanies(): Promise<Company[]>;
  getCompanyById(id: string): Promise<Company | null>;
}

export class ApiCompanyRepository implements CompanyRepository {
  async getCompanies(): Promise<Company[]> {
    return api.get<Company[]>('/companies', z.array(CompanySchema));
  }
  async getCompanyById(id: string): Promise<Company | null> {
    return api.get<Company | null>(`/companies/${id}`, CompanySchema.nullable());
  }
}

import { MockCompanyRepository } from './company.mock.repository';

export const companyRepository: CompanyRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockCompanyRepository()
    : new ApiCompanyRepository();
