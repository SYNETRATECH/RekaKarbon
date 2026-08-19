import type { AuditRepository } from './audit.repository';
import {
  mockAiAnomalyLogs,
  mockAnomalySummary,
  mockEnergyCorrelationData,
  mockSpatialSummary,
  mockConservationAreas,
  mockDroneArchive,
  mockDroneSchedules,
  mockCertificationPreview,
  mockDroneScans,
  mockKthPolygons,
  mockKthLogs,
} from '../lib/mock/audit';

export class MockAuditRepository implements AuditRepository {
  async getAiAnomalyLogs() {
    return mockAiAnomalyLogs;
  }
  async getAnomalySummary() {
    return mockAnomalySummary;
  }
  async getEnergyCorrelationData() {
    return mockEnergyCorrelationData;
  }
  async verifyAnomalyRecord(id: string) {
    const item = mockAiAnomalyLogs.find((l) => l.id === id);
    if (item) {
      item.auditStatus = 'verified';
    }
    return { success: true, id };
  }
  async getSpatialSummary() {
    return mockSpatialSummary;
  }
  async getConservationAreas() {
    return mockConservationAreas;
  }
  async getDroneArchive() {
    return mockDroneArchive;
  }
  async getDroneSchedules() {
    return mockDroneSchedules;
  }
  async getCertificationPreview() {
    return mockCertificationPreview;
  }
  async authorizeMintingCredit(_data: any) {
    return {
      success: true,
      txHash: `0x7f9a${Math.floor(Math.random() * 89999 + 10000)}...besu`,
    };
  }
  async getDroneScans() {
    return mockDroneScans;
  }
  async getKthPolygons() {
    return mockKthPolygons;
  }
  async getKthLogs() {
    return mockKthLogs;
  }
}
