import { BadRequestException } from '@nestjs/common';
import { CalculationService } from './calculation.service';

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    service = new CalculationService();
  });

  describe('normalize', () => {
    it('throws BadRequestException if input is not a record', () => {
      expect(() => service.normalize(null)).toThrow(BadRequestException);
      expect(() => service.normalize('invalid')).toThrow(BadRequestException);
    });

    it('throws BadRequestException if entries array is empty or missing', () => {
      expect(() => service.normalize({ entries: [] })).toThrow(
        BadRequestException,
      );
      expect(() => service.normalize({})).toThrow(BadRequestException);
    });

    it('normalizes stationary combustion entry and calculates scope 1 total', () => {
      const result = service.normalize({
        entries: [
          {
            id: 'entry-1',
            scope: 1,
            activityType: 'stationary_combustion',
            calculationMethod: 'fuel_consumption',
            sourceCode: 'diesel',
            sourceLabel: 'Solar Industri',
            quantity: 1000,
            unit: 'liter',
          },
        ],
      });

      expect(result.schemaVersion).toBe(2);
      expect(result.factorSetId).toBe('rekakarbon-2026-v1');
      expect(result.entries).toHaveLength(1);
      const entry = result.entries[0];
      expect(entry.id).toBe('entry-1');
      expect(entry.factorCode).toBe('diesel');
      expect(entry.emissionFactor).toBe(2.512);
      // (1000 * 2.512) / 1000 = 2.512 tCO2e
      expect(entry.emissionsTCO2e).toBeCloseTo(2.512, 4);
      expect(result.scope1).toBeCloseTo(2.512, 4);
      expect(result.scope2).toBe(0);
      expect(result.scope3).toBe(0);
    });

    it('normalizes purchased electricity and calculates scope 2 total', () => {
      const result = service.normalize({
        entries: [
          {
            id: 'entry-elec',
            scope: 2,
            activityType: 'purchased_electricity',
            calculationMethod: 'location_based',
            sourceCode: 'grid_electricity',
            sourceLabel: 'PLN Grid',
            quantity: 10000,
            unit: 'kWh',
          },
        ],
      });

      expect(result.scope2).toBeCloseTo((10000 * 0.207) / 1000, 4);
      expect(result.entries[0].factorCode).toBe('scope_2_grid_electricity');
    });

    it('normalizes mobile combustion with user distance and standard distance', () => {
      const result = service.normalize({
        entries: [
          {
            id: 'mob-1',
            scope: 1,
            activityType: 'mobile_combustion',
            calculationMethod: 'standard_distance',
            sourceCode: 'standard_vehicle',
            sourceLabel: 'Kendaraan Standar',
            quantity: 500,
            unit: 'km',
          },
          {
            id: 'mob-2',
            scope: 1,
            activityType: 'mobile_combustion',
            calculationMethod: 'user_distance',
            sourceCode: 'custom_vehicle',
            sourceLabel: 'Kendaraan Custom',
            quantity: 200,
            unit: 'km',
            emissionFactor: 0.25,
          },
        ],
      });

      expect(result.entries[0].factorCode).toBe(
        'scope_1_mobile_standard_distance',
      );
      expect(result.entries[0].emissionFactor).toBe(0.171);
      expect(result.entries[1].factorCode).toBe('scope_1_mobile_user_input');
      expect(result.entries[1].emissionFactor).toBe(0.25);
      expect(result.scope1).toBeCloseTo(
        (500 * 0.171) / 1000 + (200 * 0.25) / 1000,
        4,
      );
    });

    it('normalizes scope 3 flights, hotel, rail, and financed credits', () => {
      const result = service.normalize({
        entries: [
          {
            id: 'flight-dom',
            scope: 3,
            activityType: 'flight',
            calculationMethod: 'flight_passenger',
            sourceCode: 'flight',
            sourceLabel: 'Penerbangan Domestik',
            quantity: 4,
            unit: 'passenger',
            metadata: { flightType: 'domestic' },
          },
          {
            id: 'hotel-1',
            scope: 3,
            activityType: 'hotel',
            calculationMethod: 'hotel_room_night',
            sourceCode: 'hotel',
            sourceLabel: 'Hotel Menginap',
            quantity: 5,
            unit: 'room-night',
          },
          {
            id: 'rail-1',
            scope: 3,
            activityType: 'rail',
            calculationMethod: 'rail_distance',
            sourceCode: 'rail',
            sourceLabel: 'Kereta Api',
            quantity: 300,
            unit: 'km',
          },
          {
            id: 'credit-1',
            scope: 3,
            activityType: 'financed_credit',
            calculationMethod: 'financed_emissions',
            sourceCode: 'financed_credit',
            sourceLabel: 'Kredit Terfasilitasi',
            quantity: 10,
            unit: 'tCO2e',
          },
        ],
      });

      expect(result.entries[0].factorCode).toBe('scope_3_flight_domestic');
      expect(result.entries[1].factorCode).toBe('scope_3_hotel_room_night');
      expect(result.entries[2].factorCode).toBe('scope_3_rail_distance');
      expect(result.entries[3].factorCode).toBe(
        'scope_3_financed_direct_input',
      );
      expect(result.scope3).toBeGreaterThan(0);
    });

    it('normalizes financed security investment (corporate bond / stock)', () => {
      const result = service.normalize({
        entries: [
          {
            id: 'fin-sec-1',
            scope: 3,
            activityType: 'financed_security',
            calculationMethod: 'financed_emissions',
            sourceCode: 'stock',
            sourceLabel: 'Saham Portofolio',
            quantity: 0,
            unit: 'IDR',
            metadata: {
              securityInstrument: 'stock',
              investmentValueIDR: 10000000,
              issuerDenominatorIDR: 100000000,
              issuerEmissionsTCO2e: 500,
            },
          },
        ],
      });

      const entry = result.entries[0];
      expect(entry.factorCode).toBe('scope_3_financed_stock');
      // attribution factor = 10m / 100m = 0.1
      expect(entry.emissionFactor).toBe(0.1);
      // emissions = 500 * 0.1 = 50 tCO2e
      expect(entry.emissionsTCO2e).toBe(50);
      expect(result.scope3).toBe(50);
    });

    it('throws BadRequestException if factor is unknown', () => {
      expect(() =>
        service.normalize({
          entries: [
            {
              id: 'err-1',
              scope: 1,
              activityType: 'stationary_combustion',
              calculationMethod: 'fuel_consumption',
              sourceCode: 'unsupported_fuel',
              sourceLabel: 'Bahan Bakar Aneh',
              quantity: 100,
              unit: 'kg',
            },
          ],
        }),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException if scope is invalid', () => {
      expect(() =>
        service.normalize({
          entries: [
            {
              id: 'err-2',
              scope: 4,
              activityType: 'stationary_combustion',
              calculationMethod: 'fuel_consumption',
              sourceCode: 'diesel',
              sourceLabel: 'Solar',
              quantity: 10,
              unit: 'liter',
            },
          ],
        }),
      ).toThrow(BadRequestException);
    });
  });
});
