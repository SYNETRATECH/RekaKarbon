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
  DroneArchive,
  DroneSchedules,
  KthPolygon,
  KthLog,
  ForestProjectAuditListItem,
  ForestProjectAuditDetail,
  ForestProjectAuditDecisionInput,
  ForestInspectionDecisionInput,
} from '../types';
import {
  AiAnomalyLogSchema,
  AnomalySummarySchema,
  EnergyCorrelationItemSchema,
  SpatialSummarySchema,
  ConservationAreaSchema,
  DroneScanSchema,
  DroneArchiveSchema,
  DroneSchedulesSchema,
  KthPolygonSchema,
  KthLogSchema,
  MlAuditResultSchema,
  ForestProjectAuditListItemSchema,
  ForestProjectAuditDetailSchema,
} from '../schemas';
import { z } from 'zod';

export interface AuditRepository {
  getAiAnomalyLogs(): Promise<AiAnomalyLog[]>;
  getAnomalySummary(): Promise<AnomalySummary>;
  getEnergyCorrelationData(): Promise<EnergyCorrelationItem[]>;
  verifyAnomalyRecord(id: string): Promise<{ success: boolean; id: string }>;
  getSpatialSummary(): Promise<SpatialSummary>;
  getConservationAreas(): Promise<ConservationArea[]>;
  getDroneArchive(projectId?: string): Promise<DroneArchive>;
  getDroneSchedules(projectId?: string): Promise<DroneSchedules>;
  getCertificationPreview(): Promise<any>;
  authorizeMintingCredit(data: any): Promise<{ success: boolean; txHash: string }>;
  getDroneScans(): Promise<DroneScan[]>;
  getKthPolygons(): Promise<KthPolygon[]>;
  getKthLogs(): Promise<KthLog[]>;
  evaluateEmissionReport(params: AuditEmissionReportParams): Promise<MlAuditResult>;
  getForestProjectAuditQueue(): Promise<ForestProjectAuditListItem[]>;
  getForestProjectAuditDetail(projectId: string): Promise<ForestProjectAuditDetail>;
  decideForestProjectAudit(
    projectId: string,
    input: ForestProjectAuditDecisionInput
  ): Promise<ForestProjectAuditDetail>;
  decideForestInspectionCheckpoint(
    projectId: string,
    checkpointId: string,
    input: ForestInspectionDecisionInput
  ): Promise<ForestProjectAuditDetail>;
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
  async getDroneArchive(projectId?: string): Promise<DroneArchive> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return api.get<DroneArchive>(`/audit/drone-archive${query}`, DroneArchiveSchema);
  }
  async getDroneSchedules(projectId?: string): Promise<DroneSchedules> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return api.get<DroneSchedules>(`/audit/drone-schedules${query}`, DroneSchedulesSchema);
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
  async getForestProjectAuditQueue(): Promise<ForestProjectAuditListItem[]> {
    return api.get<ForestProjectAuditListItem[]>(
      '/audit/forest-projects',
      z.array(ForestProjectAuditListItemSchema)
    );
  }
  async getForestProjectAuditDetail(projectId: string): Promise<ForestProjectAuditDetail> {
    return api.get<ForestProjectAuditDetail>(
      `/audit/forest-projects/${encodeURIComponent(projectId)}`,
      ForestProjectAuditDetailSchema
    );
  }
  async decideForestProjectAudit(
    projectId: string,
    input: ForestProjectAuditDecisionInput
  ): Promise<ForestProjectAuditDetail> {
    return api.post<ForestProjectAuditDetail>(
      `/audit/forest-projects/${encodeURIComponent(projectId)}/decision`,
      input,
      ForestProjectAuditDetailSchema
    );
  }
  async decideForestInspectionCheckpoint(
    projectId: string,
    checkpointId: string,
    input: ForestInspectionDecisionInput
  ): Promise<ForestProjectAuditDetail> {
    return api.post<ForestProjectAuditDetail>(
      `/audit/forest-projects/${encodeURIComponent(projectId)}/checkpoints/${encodeURIComponent(checkpointId)}/decision`,
      input,
      ForestProjectAuditDetailSchema
    );
  }
}

import { MockAuditRepository } from './audit.mock.repository';

export const auditRepository: AuditRepository =
  import.meta.env.VITE_USE_MOCK_DATA === 'true'
    ? new MockAuditRepository()
    : new ApiAuditRepository();
