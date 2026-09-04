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
  async getDroneArchive(projectId?: string) {
    if (projectId) {
      const area = mockConservationAreas.find((a) => a.id === projectId);
      if (area) {
        return {
          ...mockDroneArchive,
          areaName: area.name,
          location: area.location,
          cloudCoverPercent: area.cloudCoverPercent,
        };
      }
    }
    return mockDroneArchive;
  }
  async getDroneSchedules(_projectId?: string) {
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
  async evaluateEmissionReport(params: import('../types').AuditEmissionReportParams) {
    const isUnderReporting = params.reportedEmissionsTco2e < params.productionTonnes * 0.1;
    return {
      isAnomaly: isUnderReporting,
      verdict: isUnderReporting ? ('REJECT_ANOMALY' as const) : ('PASS_VERIFIED' as const),
      anomalyScore: isUnderReporting ? 0.942 : 0.085,
      trustScore: isUnderReporting ? 38.5 : 94.2,
      divergencePercent: isUnderReporting ? 54.2 : 4.1,
      expectedEmissionTco2e: Math.round(params.productionTonnes * 0.28 * 100) / 100,
      reportedEmissionTco2e: params.reportedEmissionsTco2e,
      scoreDjp: 98.5,
      scoreBbm: isUnderReporting ? 42.0 : 96.0,
      scoreCems: 95.0,
      flags: isUnderReporting
        ? ['UNDER_REPORTING_TERINDIKASI', 'DEVIASI_FISIK_DAN_LAPORAN_TINGGI']
        : [],
      explanation: isUnderReporting
        ? 'Anomali terdeteksi: Laporan emisi berada di bawah ambang batas fisik.'
        : 'Laporan terverifikasi konsisten dengan model ONNX dan indeks fiskal.',
    };
  }
  async getForestProjectAuditQueue() {
    return [];
  }
  async getForestProjectAuditDetail(
    _projectId: string
  ): Promise<import('../types').ForestProjectAuditDetail> {
    throw new Error('Data audit proyek kehutanan mock belum tersedia.');
  }
  async decideForestProjectAudit(
    _projectId: string,
    _input: import('../types').ForestProjectAuditDecisionInput
  ): Promise<import('../types').ForestProjectAuditDetail> {
    throw new Error('Data audit proyek kehutanan mock belum tersedia.');
  }
}
