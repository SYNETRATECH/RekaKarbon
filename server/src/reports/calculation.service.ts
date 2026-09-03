import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  CalculationEntry,
  CalculatorActivityType,
  CalculatorCalculationMethod,
  CalculatorCalculationData,
} from './types';

const FACTOR_SET_ID = 'rekakarbon-2026-v1';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(
      `Field ${field} harus berupa teks dan tidak boleh kosong`,
    );
  }
  return value;
}

function positiveNumber(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(
      `Field ${field} harus berupa angka lebih besar dari nol`,
    );
  }
  return parsed;
}

function scopeValue(value: unknown): 1 | 2 | 3 {
  const parsed = Number(value);
  if (parsed !== 1 && parsed !== 2 && parsed !== 3) {
    throw new BadRequestException(
      'Scope aktivitas harus bernilai 1, 2, atau 3',
    );
  }
  return parsed;
}

const ACTIVITY_TYPES: readonly CalculatorActivityType[] = [
  'stationary_combustion',
  'mobile_combustion',
  'purchased_electricity',
  'flight',
  'hotel',
  'rail',
  'financed_credit',
  'financed_security',
];

const CALCULATION_METHODS: readonly CalculatorCalculationMethod[] = [
  'fuel_consumption',
  'standard_distance',
  'user_distance',
  'location_based',
  'flight_passenger',
  'hotel_room_night',
  'rail_distance',
  'financed_emissions',
];

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new BadRequestException(`Nilai ${field} tidak didukung`);
  }
  return value as T;
}

function metadataValue(value: unknown): Prisma.InputJsonObject {
  if (!isRecord(value)) return {};
  const result: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') result[key] = item;
    else if (typeof item === 'number' && Number.isFinite(item))
      result[key] = item;
    else if (typeof item === 'boolean') result[key] = item;
  }
  return result;
}

@Injectable()
export class CalculationService {
  normalize(input: unknown): CalculatorCalculationData {
    if (!isRecord(input)) {
      throw new BadRequestException('calculationData harus berupa objek');
    }

    const rawEntries = input.entries;
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      throw new BadRequestException('Minimal satu aktivitas emisi harus diisi');
    }

    const entries = rawEntries.map((rawEntry, index) =>
      this.normalizeEntry(rawEntry, index),
    );
    const scope1 = this.scopeTotal(entries, 1);
    const scope2 = this.scopeTotal(entries, 2);
    const scope3 = this.scopeTotal(entries, 3);

    return {
      schemaVersion: 2,
      factorSetId: FACTOR_SET_ID,
      scope1,
      scope2,
      scope3,
      entries,
    };
  }

  private normalizeEntry(value: unknown, index: number): CalculationEntry {
    if (!isRecord(value)) {
      throw new BadRequestException(`Aktivitas ke-${index + 1} tidak valid`);
    }

    const activityType = enumValue(
      value.activityType,
      ACTIVITY_TYPES,
      `activityType aktivitas ke-${index + 1}`,
    );
    const calculationMethod = enumValue(
      value.calculationMethod,
      CALCULATION_METHODS,
      `calculationMethod aktivitas ke-${index + 1}`,
    );
    const sourceCode = requiredString(
      value.sourceCode,
      `sourceCode aktivitas ke-${index + 1}`,
    );
    const sourceLabel = requiredString(
      value.sourceLabel,
      `sourceLabel aktivitas ke-${index + 1}`,
    );
    const unit = requiredString(value.unit, `unit aktivitas ke-${index + 1}`);
    const quantity =
      activityType === 'financed_security'
        ? 0
        : positiveNumber(value.quantity, `quantity aktivitas ke-${index + 1}`);
    const scope = scopeValue(value.scope);
    const factor = this.resolveFactor(
      value,
      activityType,
      calculationMethod,
      sourceCode,
    );
    const normalizedQuantity = factor.quantity ?? quantity;
    const emissionsTCO2e =
      factor.resultUnit === 'tCO2e'
        ? normalizedQuantity * factor.value
        : (normalizedQuantity * factor.value) / 1000;

    return {
      id: requiredString(value.id, `id aktivitas ke-${index + 1}`),
      scope,
      activityType,
      calculationMethod,
      sourceCode,
      sourceLabel,
      quantity: normalizedQuantity,
      unit,
      factorCode: factor.factorCode,
      factorSetId: FACTOR_SET_ID,
      emissionFactor: factor.value,
      factorUnit: factor.unit,
      emissionsTCO2e,
      metadata: metadataValue(value.metadata),
    };
  }

  private resolveFactor(
    value: RecordValue,
    activityType: CalculatorActivityType,
    calculationMethod: CalculatorCalculationMethod,
    sourceCode: string,
  ): {
    factorCode: string;
    value: number;
    unit: string;
    quantity?: number;
    resultUnit?: 'kgCO2e' | 'tCO2e';
  } {
    if (
      activityType === 'mobile_combustion' &&
      calculationMethod === 'user_distance'
    ) {
      return {
        factorCode: 'scope_1_mobile_user_input',
        value: positiveNumber(
          value.emissionFactor,
          'emissionFactor non-standar',
        ),
        unit: 'kgCO2e/km',
        resultUnit: 'kgCO2e',
      };
    }

    if (
      activityType === 'mobile_combustion' &&
      calculationMethod === 'standard_distance'
    ) {
      return {
        factorCode: 'scope_1_mobile_standard_distance',
        value: 0.171,
        unit: 'kgCO2e/km',
        resultUnit: 'kgCO2e',
      };
    }

    const factors: Record<string, { value: number; unit: string }> = {
      coal: { value: 2.531, unit: 'kgCO2e/kg' },
      coal_briquette: { value: 2.531, unit: 'kgCO2e/kg' },
      charcoal: { value: 2.531, unit: 'kgCO2e/kg' },
      natural_gas: { value: 2.023, unit: 'kgCO2e/m3' },
      lpg: { value: 2.939, unit: 'kgCO2e/kg' },
      lgV: { value: 2.105, unit: 'kgCO2e/liter' },
      lgv: { value: 2.105, unit: 'kgCO2e/liter' },
      lng: { value: 2.023, unit: 'kgCO2e/kg' },
      avtur: { value: 2.512, unit: 'kgCO2e/liter' },
      kerosene: { value: 2.512, unit: 'kgCO2e/liter' },
      diesel: { value: 2.512, unit: 'kgCO2e/liter' },
      diesel_cn53: { value: 2.512, unit: 'kgCO2e/liter' },
      diesel_cn51: { value: 2.512, unit: 'kgCO2e/liter' },
      diesel_cn48: { value: 2.512, unit: 'kgCO2e/liter' },
      fuel_oil: { value: 3.168, unit: 'kgCO2e/liter' },
      gasoline_ron98: { value: 2.105, unit: 'kgCO2e/liter' },
      gasoline_ron92: { value: 2.105, unit: 'kgCO2e/liter' },
      gasoline_ron90: { value: 2.105, unit: 'kgCO2e/liter' },
      gasoline_ron88: { value: 2.105, unit: 'kgCO2e/liter' },
    };

    if (activityType === 'purchased_electricity') {
      return {
        factorCode: 'scope_2_grid_electricity',
        value: 0.207,
        unit: 'kgCO2e/kWh',
        resultUnit: 'kgCO2e',
      };
    }
    if (activityType === 'flight') {
      const flightType =
        isRecord(value.metadata) &&
        value.metadata.flightType === 'international'
          ? 'international'
          : 'domestic';
      return {
        factorCode: `scope_3_flight_${flightType}`,
        value: flightType === 'international' ? 0.315 : 0.244,
        unit: 'kgCO2e/passenger',
        resultUnit: 'kgCO2e',
      };
    }
    if (activityType === 'hotel') {
      return {
        factorCode: 'scope_3_hotel_room_night',
        value: 10,
        unit: 'kgCO2e/room-night',
        resultUnit: 'kgCO2e',
      };
    }
    if (activityType === 'rail') {
      return {
        factorCode: 'scope_3_rail_distance',
        value: 0.041,
        unit: 'kgCO2e/km',
        resultUnit: 'kgCO2e',
      };
    }
    if (activityType === 'financed_credit') {
      return {
        factorCode: 'scope_3_financed_direct_input',
        value: 1000,
        unit: 'kgCO2e/tCO2e',
        resultUnit: 'kgCO2e',
      };
    }

    if (activityType === 'financed_security') {
      const metadata = isRecord(value.metadata) ? value.metadata : {};
      const securityInstrument = requiredString(
        metadata.securityInstrument ?? metadata.financedCategory,
        'metadata.securityInstrument',
      );
      if (
        !['government_bond', 'stock', 'corporate_bond'].includes(
          securityInstrument,
        )
      ) {
        throw new BadRequestException(
          'Jenis surat berharga tidak didukung untuk perhitungan emisi',
        );
      }

      const investmentValueIDR = positiveNumber(
        metadata.investmentValueIDR,
        'metadata.investmentValueIDR',
      );
      const isGovernmentBond = securityInstrument === 'government_bond';
      if (isGovernmentBond) {
        requiredString(metadata.countryCode, 'metadata.countryCode');
      }
      const issuerDenominatorIDR = positiveNumber(
        isGovernmentBond
          ? metadata.sovereignDebtIDR
          : metadata.issuerDenominatorIDR,
        isGovernmentBond
          ? 'metadata.sovereignDebtIDR'
          : 'metadata.issuerDenominatorIDR',
      );
      const issuerEmissionsTCO2e = positiveNumber(
        isGovernmentBond
          ? metadata.sovereignEmissionsTCO2e
          : metadata.issuerEmissionsTCO2e,
        isGovernmentBond
          ? 'metadata.sovereignEmissionsTCO2e'
          : 'metadata.issuerEmissionsTCO2e',
      );
      const attributionFactor = investmentValueIDR / issuerDenominatorIDR;
      if (!Number.isFinite(attributionFactor) || attributionFactor > 1) {
        throw new BadRequestException(
          'Nilai investasi tidak boleh melebihi nilai pembanding penerbit atau negara',
        );
      }

      return {
        factorCode: `scope_3_financed_${securityInstrument}`,
        value: attributionFactor,
        unit: 'tCO2e/tCO2e',
        quantity: issuerEmissionsTCO2e,
        resultUnit: 'tCO2e',
      };
    }

    const factor = factors[sourceCode];
    if (!factor)
      throw new BadRequestException(
        `Faktor emisi untuk ${sourceCode} belum tersedia`,
      );
    return { factorCode: sourceCode, ...factor, resultUnit: 'kgCO2e' };
  }

  private scopeTotal(entries: CalculationEntry[], scope: 1 | 2 | 3): number {
    return entries
      .filter((entry) => entry.scope === scope)
      .reduce((total, entry) => total + entry.emissionsTCO2e, 0);
  }
}
