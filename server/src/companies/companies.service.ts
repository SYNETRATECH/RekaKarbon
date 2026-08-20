import { Injectable } from '@nestjs/common';
import { Company } from '../types/company';
import { MOCK_COMPANIES_DATA } from './companies.mock';

@Injectable()
export class CompaniesService {
  private readonly companies: Company[] = [...MOCK_COMPANIES_DATA];

  findAll(): Promise<Company[]> {
    return Promise.resolve(this.companies);
  }

  findById(id: string): Promise<Company | undefined> {
    return Promise.resolve(this.companies.find((c) => c.id === id));
  }
}
