import { Injectable } from '@nestjs/common';
import {
  MOCK_AI_ANOMALY_LOGS,
  MOCK_ANOMALY_SUMMARY,
  MOCK_ENERGY_CORRELATION_DATA,
  MOCK_SPATIAL_SUMMARY,
  MOCK_CONSERVATION_AREAS,
  MOCK_DRONE_ARCHIVE,
  MOCK_DRONE_SCHEDULES,
  MOCK_CERTIFICATION_PREVIEW,
  MOCK_DRONE_SCANS,
  MOCK_KTH_POLYGONS,
  MOCK_KTH_LOGS,
} from './audit.mock';
import type {
  AnomalySummary,
  AiAnomalyLog,
  EnergyCorrelationItem,
  ConservationArea,
} from '../types/audit';
import type { AuthorizeMintingDto } from './dto';

@Injectable()
export class AuditService {
  private readonly anomalyLogs: AiAnomalyLog[] = [...MOCK_AI_ANOMALY_LOGS];

  getAiAnomalyLogs(): Promise<AiAnomalyLog[]> {
    return Promise.resolve(this.anomalyLogs);
  }

  getAnomalySummary(): Promise<AnomalySummary> {
    return Promise.resolve(MOCK_ANOMALY_SUMMARY);
  }

  getEnergyCorrelation(): Promise<EnergyCorrelationItem[]> {
    return Promise.resolve(MOCK_ENERGY_CORRELATION_DATA);
  }

  verifyAnomalyRecord(id: string): Promise<{ success: boolean; id: string }> {
    const item = this.anomalyLogs.find((l) => l.id === id);
    if (item) {
      item.auditStatus = 'verified';
    }
    return Promise.resolve({ success: true, id });
  }

  getSpatialSummary() {
    return Promise.resolve(MOCK_SPATIAL_SUMMARY);
  }

  getConservationAreas(): Promise<ConservationArea[]> {
    return Promise.resolve(MOCK_CONSERVATION_AREAS);
  }

  getDroneArchive() {
    return Promise.resolve(MOCK_DRONE_ARCHIVE);
  }

  getDroneSchedules() {
    return Promise.resolve(MOCK_DRONE_SCHEDULES);
  }

  getCertificationPreview() {
    return Promise.resolve(MOCK_CERTIFICATION_PREVIEW);
  }

  authorizeMintingCredit(_data?: AuthorizeMintingDto) {
    void _data;
    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    return Promise.resolve({
      success: true,
      txHash: `0x7f9a${randomHex}4857102948571029485710294857102948571029485`,
    });
  }

  getDroneScans() {
    return Promise.resolve(MOCK_DRONE_SCANS);
  }

  getKthPolygons() {
    return Promise.resolve(MOCK_KTH_POLYGONS);
  }

  getKthLogs() {
    return Promise.resolve(MOCK_KTH_LOGS);
  }
}
