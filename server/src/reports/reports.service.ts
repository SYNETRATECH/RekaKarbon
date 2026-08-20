import { Injectable } from '@nestjs/common';
import type { EmissionReport } from '../types/report';
import { MOCK_EMISSION_REPORTS } from './reports.mock';

@Injectable()
export class ReportsService {
  getEmissionReports(): Promise<EmissionReport[]> {
    return Promise.resolve(MOCK_EMISSION_REPORTS);
  }
}
