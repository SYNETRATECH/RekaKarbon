import { api } from '../lib/api';
import type {
  AnomalySummary,
  EnergyCorrelationItem,
  AiAnomalyLog,
  MlAuditResult,
  AuditEmissionReportParams,
  SpatialSummary,
  ConservationArea,
  DroneScan,
  KthPolygon,
  KthLog,
} from '../types';
import {
  AiAnomalyLogSchema,
  AnomalySummarySchema,
  EnergyCorrelationItemSchema,
  SpatialSummarySchema,
  ConservationAreaSchema,
  DroneScanSchema,
  KthPolygonSchema,
  KthLogSchema,
  MlAuditResultSchema,
} from '../schemas';
import { z } from 'zod';

export interface AuditRepository {
  getAiAnomalyLogs(): Promise<AiAnomalyLog[]>;
  getAnomalySummary(): Promise<AnomalySummary>;
  getEnergyCorrelationData(): Promise<EnergyCorrelationItem[]>;
  verifyAnomalyRecord(id: string): Promise<{ success: boolean; id: string }>;
  getSpatialSummary(): Promise<SpatialSummary>;
  getConservationAreas(): Promise<ConservationArea[]>;
  getDroneArchive(): Promise<any>;
  getDroneSchedules(): Promise<any>;
  getCertificationPreview(): Promise<any>;
  authorizeMintingCredit(data: any): Promise<{ success: boolean; txHash: string }>;
  getDroneScans(): Promise<DroneScan[]>;
  getKthPolygons(): Promise<KthPolygon[]>;
  getKthLogs(): Promise<KthLog[]>;
  evaluateEmissionReport(params: AuditEmissionReportParams): Promise<MlAuditResult>;
}

export class ApiAuditRepository implements AuditRepository {
  async getAiAnomalyLogs(): Promise<AiAnomalyLog[]> {
    return api.get<AiAnomalyLog[]>('/audit/anomaly-logs', z.array(AiAnomalyLogSchema));
  }
  async getAnomalySummary(): Promise<AnomalySummary> {
    return api.get<AnomalySummary>('/audit/anomaly-summary', AnomalySummarySchema);
  }
  async getEnergyCorrelationData(): Promise<EnergyCorrelationItem[]> {
    return api.get<EnergyCorrelationItem[]>(
      '/audit/energy-correlation',
      z.array(EnergyCorrelationItemSchema)
    );
  }
  async verifyAnomalyRecord(id: string): Promise<{ success: boolean; id: string }> {
    return api.post<{ success: boolean; id: string }>(
      `/audit/verify/${id}`,
      {},
      z.object({ success: z.boolean(), id: z.string() })
    );
  }
  async getSpatialSummary(): Promise<SpatialSummary> {
    return api.get<SpatialSummary>('/audit/spatial-summary', SpatialSummarySchema);
  }
  async getConservationAreas(): Promise<ConservationArea[]> {
    return api.get<ConservationArea[]>(
      '/audit/conservation-areas',
      z.array(ConservationAreaSchema)
    );
  }
  async getDroneArchive(): Promise<any> {
    return api.get<any>('/audit/drone-archive');
  }
  async getDroneSchedules(): Promise<any> {
    return api.get<any>('/audit/drone-schedules');
  }
  async getCertificationPreview(): Promise<any> {
    return api.get<any>('/audit/certification-preview');
  }
  async authorizeMintingCredit(data: any): Promise<{ success: boolean; txHash: string }> {
    return api.post<{ success: boolean; txHash: string }>(
      '/audit/authorize-minting',
      data,
      z.object({ success: z.boolean(), txHash: z.string() })
    );
  }
  async getDroneScans(): Promise<DroneScan[]> {
    return api.get<DroneScan[]>('/audit/drone-scans', z.array(DroneScanSchema));
  }
  async getKthPolygons(): Promise<KthPolygon[]> {
    return api.get<KthPolygon[]>('/audit/kth-polygons', z.array(KthPolygonSchema));
  }
  async getKthLogs(): Promise<KthLog[]> {
    return api.get<KthLog[]>('/audit/kth-logs', z.array(KthLogSchema));
  }
  async evaluateEmissionReport(params: AuditEmissionReportParams): Promise<MlAuditResult> {
    return api.post<MlAuditResult>('/audit/evaluate-emission', params, MlAuditResultSchema);
  }
}

import { MockAuditRepository } from './audit.mock.repository';

export const auditRepository: AuditRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockAuditRepository()
    : new ApiAuditRepository();
