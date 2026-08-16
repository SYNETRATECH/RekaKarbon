import {
  mockAiAnomalyLogs,
  mockAnomalySummary,
  mockEnergyCorrelationData,
  mockDroneScans,
  mockKthPolygons,
  mockKthLogs,
} from '../lib/mock/audit';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface AnomalySummary {
  emitenTerdeteksiAnomali: number;
  totalEmitenAktif: number;
  rataDeviasiEmisi: string;
  descDeviasi: string;
  eFakturTidakCocok: number;
  descEFaktur: string;
}

export interface EnergyCorrelationItem {
  name: string;
  reported: number;
  estimated: number;
}

export interface AuditRepository {
  getAiAnomalyLogs(): Promise<any[]>;
  getAnomalySummary(): Promise<AnomalySummary>;
  getEnergyCorrelationData(): Promise<EnergyCorrelationItem[]>;
  verifyAnomalyRecord(id: string): Promise<{ success: boolean; id: string }>;
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
