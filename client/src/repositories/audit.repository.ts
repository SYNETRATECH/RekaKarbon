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
import { api } from '../lib/api';
import type { AnomalySummary, EnergyCorrelationItem } from '../types';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface AuditRepository {
  getAiAnomalyLogs(): Promise<any[]>;
  getAnomalySummary(): Promise<AnomalySummary>;
  getEnergyCorrelationData(): Promise<EnergyCorrelationItem[]>;
  verifyAnomalyRecord(id: string): Promise<{ success: boolean; id: string }>;
  getSpatialSummary(): Promise<any>;
  getConservationAreas(): Promise<any[]>;
  getDroneArchive(): Promise<any>;
  getDroneSchedules(): Promise<any>;
  getCertificationPreview(): Promise<any>;
  authorizeMintingCredit(data: any): Promise<{ success: boolean; txHash: string }>;
  getDroneScans(): Promise<any[]>;
  getKthPolygons(): Promise<any[]>;
  getKthLogs(): Promise<any[]>;
}

class MockAuditRepository implements AuditRepository {
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
      item.auditStatus = 'Verified';
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
  async authorizeMintingCredit(data: any) {
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

class ApiAuditRepository implements AuditRepository {
  async getAiAnomalyLogs() {
    return api.get<any[]>('/audit/anomaly-logs');
  }
  async getAnomalySummary() {
    return api.get<AnomalySummary>('/audit/anomaly-summary');
  }
  async getEnergyCorrelationData() {
    return api.get<EnergyCorrelationItem[]>('/audit/energy-correlation');
  }
  async verifyAnomalyRecord(id: string) {
    return api.post<{ success: boolean; id: string }>(`/audit/verify/${id}`, {});
  }
  async getSpatialSummary() {
    return api.get<any>('/audit/spatial-summary');
  }
  async getConservationAreas() {
    return api.get<any[]>('/audit/conservation-areas');
  }
  async getDroneArchive() {
    return api.get<any>('/audit/drone-archive');
  }
  async getDroneSchedules() {
    return api.get<any>('/audit/drone-schedules');
  }
  async getCertificationPreview() {
    return api.get<any>('/audit/certification-preview');
  }
  async authorizeMintingCredit(data: any) {
    return api.post<{ success: boolean; txHash: string }>('/audit/authorize-minting', data);
  }
  async getDroneScans() {
    return api.get<any[]>('/audit/drone-scans');
  }
  async getKthPolygons() {
    return api.get<any[]>('/audit/kth-polygons');
  }
  async getKthLogs() {
    return api.get<any[]>('/audit/kth-logs');
  }
}

export const auditRepository: AuditRepository = useMock
  ? new MockAuditRepository()
  : new ApiAuditRepository();
