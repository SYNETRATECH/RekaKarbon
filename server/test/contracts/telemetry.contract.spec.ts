import { TelemetryController } from '../../src/telemetry/telemetry.controller';
import { TelemetryService } from '../../src/telemetry/telemetry.service';
import {
  createContractTestHarness,
  ContractTestHarness,
  expectContract,
} from '../../src/common/testing/contract-test-harness';
import {
  CemsReadingSchema,
  ForestSensorReadingSchema,
} from '../../../client/src/schemas';
import { z } from 'zod';

describe('Telemetry API Contract Test', () => {
  let harness: ContractTestHarness;

  const mockCemsReading = {
    id: '1',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
    companyName: 'PT Semen Gresik Pabrik Tuban',
    stackId: 'STACK-01',
    co2Ppm: 1420.5,
    so2MgM3: 280.2,
    noxMgM3: 310.4,
    flowRateM3Sec: 125.8,
    temperatureC: 185.6,
    timestamp: '2026-02-14T08:00:00.000Z',
    isAnomaly: false,
  };

  const mockForestReading = {
    id: '2',
    projectId: 'b2c3d4e5-0002-4000-8000-000000000001',
    projectName: 'TN Baluran Restorasi',
    nodeId: 'NODE-SENSOR-04',
    canopyMoisturePercent: 68.5,
    soilMoisturePercent: 42.1,
    ambientTempC: 27.8,
    solarRadiationWPerm2: 650.0,
    timestamp: '2026-02-14T08:00:00.000Z',
  };

  const mockTelemetryService = {
    getCemsReadings: jest.fn().mockResolvedValue([mockCemsReading]),
    getForestReadings: jest.fn().mockResolvedValue([mockForestReading]),
    ingestCems: jest.fn().mockResolvedValue(mockCemsReading),
    ingestForest: jest.fn().mockResolvedValue(mockForestReading),
  };

  beforeAll(async () => {
    harness = await createContractTestHarness({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: mockTelemetryService,
        },
      ],
    });
  });

  afterAll(async () => {
    await harness.close();
  });

  it('GET /telemetry/cems returns array adhering to CemsReadingSchema', async () => {
    const res = await harness.http.get('/telemetry/cems').expect(200);
    const list = expectContract(res.body, z.array(CemsReadingSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].companyId).toBe(mockCemsReading.companyId);
    expect(list[0].stackId).toBe('STACK-01');
  });

  it('GET /telemetry/forest returns array adhering to ForestSensorReadingSchema', async () => {
    const res = await harness.http.get('/telemetry/forest').expect(200);
    const list = expectContract(res.body, z.array(ForestSensorReadingSchema));
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].projectId).toBe(mockForestReading.projectId);
    expect(list[0].nodeId).toBe('NODE-SENSOR-04');
  });

  it('POST /telemetry/cems ingests sensor data and returns valid CemsReadingSchema', async () => {
    const payload = {
      companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
      stackId: 'STACK-01',
      co2Ppm: 1420.5,
      so2MgM3: 280.2,
      noxMgM3: 310.4,
      flowRateM3Sec: 125.8,
      temperatureC: 185.6,
    };
    const res = await harness.http
      .post('/telemetry/cems')
      .send(payload)
      .expect(201);
    const item = expectContract(res.body, CemsReadingSchema);
    expect(item.companyId).toBe(payload.companyId);
  });

  it('POST /telemetry/forest ingests environmental data and returns ForestSensorReadingSchema', async () => {
    const payload = {
      projectId: 'b2c3d4e5-0002-4000-8000-000000000001',
      nodeId: 'NODE-SENSOR-04',
      canopyMoisturePercent: 68.5,
      soilMoisturePercent: 42.1,
      ambientTempC: 27.8,
      solarRadiationWPerm2: 650.0,
    };
    const res = await harness.http
      .post('/telemetry/forest')
      .send(payload)
      .expect(201);
    const item = expectContract(res.body, ForestSensorReadingSchema);
    expect(item.projectId).toBe(payload.projectId);
  });
});
