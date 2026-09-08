import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CalculationEntry,
  CalculatorActivityType,
  CalculatorCalculationMethod,
  CalculatorCalculationData,
} from './types';
import {
  isRecord,
  requiredString,
  positiveNumber,
  enumValue,
  type RecordValue,
} from '../common/utils';
import {
  FACTOR_SET_ID,
  ACTIVITY_TYPES,
  CALCULATION_METHODS,
  STANDARD_EMISSION_FACTORS,
  scopeValue,
  metadataValue,
} from './utils';

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

    const factor = STANDARD_EMISSION_FACTORS[sourceCode];
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
