import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CemsReading, ForestSensorReading } from './types';
import type { CemsTelemetryDto, ForestSensorTelemetryDto } from './dto';

@Injectable()
export class TelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCemsReadings(companyId?: string): Promise<CemsReading[]> {
    const where = companyId ? { companyId } : {};
    const records = await this.prisma.cemsTelemetryLog.findMany({
      where,
      include: { company: true },
      orderBy: { recordedAt: 'desc' },
    });
    return records.map((r) => ({
      id: r.id.toString(),
      companyId: r.companyId,
      companyName: r.company.name,
      stackId: r.smokestackId || 'STACK-01',
      co2Ppm: Number(r.co2Ppm),
      so2MgM3: Number(r.so2MgM3),
      noxMgM3: Number(r.noxMgM3),
      flowRateM3Sec: Number(r.flowRateM3Sec),
      temperatureC: Number(r.temperatureC),
      timestamp: r.recordedAt.toISOString(),
      isAnomaly: r.isAnomaly,
    }));
  }

  async getForestReadings(projectId?: string): Promise<ForestSensorReading[]> {
    const where = projectId ? { projectId } : {};
    const records = await this.prisma.forestSensorTelemetryLog.findMany({
      where,
      include: { project: true },
      orderBy: { recordedAt: 'desc' },
    });
    return records.map((r) => ({
      id: r.id.toString(),
      projectId: r.projectId,
      projectName: r.project.projectName,
      nodeId: r.nodeId,
      canopyMoisturePercent: Number(r.canopyMoisturePercent),
      soilMoisturePercent: Number(r.soilMoisturePercent),
      ambientTempC: Number(r.ambientTempC),
      solarRadiationWPerm2: Number(r.solarRadiationWM2),
      timestamp: r.recordedAt.toISOString(),
    }));
  }

  async ingestCems(dto: CemsTelemetryDto): Promise<CemsReading> {
    const isAnomaly = dto.co2Ppm > 1800 || dto.so2MgM3 > 400;
    const created = await this.prisma.cemsTelemetryLog.create({
      data: {
        companyId: dto.companyId,
        co2Ppm: dto.co2Ppm,
        so2MgM3: dto.so2MgM3,
        noxMgM3: dto.noxMgM3,
        flowRateM3Sec: dto.flowRateM3Sec,
        temperatureC: dto.temperatureC,
        isAnomaly,
      },
      include: { company: true },
    });
    return {
      id: created.id.toString(),
      companyId: created.companyId,
      companyName: created.company.name,
      stackId: dto.stackId,
      co2Ppm: Number(created.co2Ppm),
      so2MgM3: Number(created.so2MgM3),
      noxMgM3: Number(created.noxMgM3),
      flowRateM3Sec: Number(created.flowRateM3Sec),
      temperatureC: Number(created.temperatureC),
      timestamp: created.recordedAt.toISOString(),
      isAnomaly: created.isAnomaly,
    };
  }

  async ingestForest(
    dto: ForestSensorTelemetryDto,
  ): Promise<ForestSensorReading> {
    const created = await this.prisma.forestSensorTelemetryLog.create({
      data: {
        projectId: dto.projectId,
        nodeId: dto.nodeId,
        canopyMoisturePercent: dto.canopyMoisturePercent,
        soilMoisturePercent: dto.soilMoisturePercent,
        ambientTempC: dto.ambientTempC,
        solarRadiationWM2: dto.solarRadiationWPerm2,
      },
      include: { project: true },
    });
    return {
      id: created.id.toString(),
      projectId: created.projectId,
      projectName: created.project.projectName,
      nodeId: created.nodeId,
      canopyMoisturePercent: Number(created.canopyMoisturePercent),
      soilMoisturePercent: Number(created.soilMoisturePercent),
      ambientTempC: Number(created.ambientTempC),
      solarRadiationWPerm2: Number(created.solarRadiationWM2),
      timestamp: created.recordedAt.toISOString(),
    };
  }
}
