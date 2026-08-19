import { api } from '../lib/api';
import type { AnomalySummary, EnergyCorrelationItem } from '../types';

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

export class ApiAuditRepository implements AuditRepository {
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

export const auditRepository: AuditRepository =
  import.meta.env.VITE_USE_MOCK_DATA !== 'false'
    ? new (await import('./audit.mock.repository')).MockAuditRepository()
    : new ApiAuditRepository();
