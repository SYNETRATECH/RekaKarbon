import { faker } from '@faker-js/faker';
import { fakeUuid, fakeDateTimeString } from './domain-generators';
import type {
  CemsReading,
  ForestSensorReading,
} from '../../src/telemetry/types';

export function createMockCemsReading(
  overrides?: Partial<CemsReading>,
): CemsReading {
  const co2Ppm =
    overrides?.co2Ppm ??
    Number(faker.number.float({ min: 800, max: 2200, fractionDigits: 1 }));
  const so2MgM3 =
    overrides?.so2MgM3 ??
    Number(faker.number.float({ min: 100, max: 450, fractionDigits: 1 }));
  const isAnomaly = overrides?.isAnomaly ?? (co2Ppm > 1800 || so2MgM3 > 400);

  return {
    id: overrides?.id ?? faker.string.numeric(5),
    companyId: overrides?.companyId ?? fakeUuid(),
    companyName: overrides?.companyName ?? `PT ${faker.company.name()}`,
    stackId:
      overrides?.stackId ?? `STACK-0${faker.number.int({ min: 1, max: 6 })}`,
    co2Ppm,
    so2MgM3,
    noxMgM3:
      overrides?.noxMgM3 ??
      Number(faker.number.float({ min: 150, max: 350, fractionDigits: 1 })),
    flowRateM3Sec:
      overrides?.flowRateM3Sec ??
      Number(faker.number.float({ min: 80, max: 180, fractionDigits: 1 })),
    temperatureC:
      overrides?.temperatureC ??
      Number(faker.number.float({ min: 140, max: 220, fractionDigits: 1 })),
    timestamp: overrides?.timestamp ?? fakeDateTimeString(),
    isAnomaly,
    ...overrides,
  };
}

export function createMockForestSensorReading(
  overrides?: Partial<ForestSensorReading>,
): ForestSensorReading {
  return {
    id: overrides?.id ?? faker.string.numeric(5),
    projectId: overrides?.projectId ?? fakeUuid(),
    projectName: overrides?.projectName ?? 'TN Baluran Restorasi',
    nodeId: overrides?.nodeId ?? `NODE-SENSOR-${faker.string.numeric(2)}`,
    canopyMoisturePercent:
      overrides?.canopyMoisturePercent ??
      Number(faker.number.float({ min: 40, max: 90, fractionDigits: 1 })),
    soilMoisturePercent:
      overrides?.soilMoisturePercent ??
      Number(faker.number.float({ min: 25, max: 70, fractionDigits: 1 })),
    ambientTempC:
      overrides?.ambientTempC ??
      Number(faker.number.float({ min: 22, max: 36, fractionDigits: 1 })),
    solarRadiationWPerm2:
      overrides?.solarRadiationWPerm2 ??
      Number(faker.number.float({ min: 300, max: 950, fractionDigits: 1 })),
    timestamp: overrides?.timestamp ?? fakeDateTimeString(),
    ...overrides,
  };
}
