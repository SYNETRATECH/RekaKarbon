import { mockAiAnomalyLogs, mockDroneScans, mockKthPolygons, mockKthLogs } from '../lib/mock/audit';
import { api } from '../lib/api';

const useMock = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface AuditRepository {
  getAiAnomalyLogs(): Promise<any[]>;
  getDroneScans(): Promise<any[]>;
  getKthPolygons(): Promise<any[]>;
  getKthLogs(): Promise<any[]>;
}

class MockAuditRepository implements AuditRepository {
  async getAiAnomalyLogs() {
    return mockAiAnomalyLogs;
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
