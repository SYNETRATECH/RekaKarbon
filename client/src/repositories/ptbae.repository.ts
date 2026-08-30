import type { ComplianceData, PtbaeAllocation } from '../types';
import { api } from '../lib/api';
import { getMockPtbaeAllocation } from '../lib/mock/ptbae';

export interface PtbaeRepository {
  getAllocation(sectorId: string, complianceYear: number): Promise<PtbaeAllocation | null>;
}

export class ApiPtbaeRepository implements PtbaeRepository {
  async getAllocation(_sectorId: string, complianceYear: number): Promise<PtbaeAllocation | null> {
    const data = await api.get<ComplianceData>(`/emitter/compliance?year=${complianceYear}`);
    if (data.complianceYear !== complianceYear || data.quotaPTBAE === null) {
      return null;
    }

    return {
      complianceYear,
      quotaTCO2e: data.quotaPTBAE,
      status: data.quotaPTBAEStatus,
      sourceDocument: data.quotaPTBAESourceDocument ?? 'Dokumen PTBAE-PU belum dicantumkan',
    };
  }
}

export class MockPtbaeRepository implements PtbaeRepository {
  async getAllocation(sectorId: string, complianceYear: number): Promise<PtbaeAllocation | null> {
    return getMockPtbaeAllocation(sectorId, complianceYear);
  }
}

export const ptbaeRepository: PtbaeRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockPtbaeRepository()
    : new ApiPtbaeRepository();
