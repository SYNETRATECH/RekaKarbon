import { describe, it, expect, vi, afterEach } from 'vitest';
import { api, ApiValidationError, resolveApiBaseUrl } from '../lib/api';
import {
  AuthResponseSchema,
  ProjectSchema,
  BursaItemSchema,
  CarbonTaxCalculationSchema,
} from '../schemas';
import { z } from 'zod';
import {
  createMockProject,
  createMockBursaItem,
  createMockAuthResponse,
  createMockCarbonTaxCalculation,
} from './factories';

describe('Client-Side API Contract & Envelope Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('NestJS TransformInterceptor Envelope Integration', () => {
    it('unwraps NestJS { success: true, data } envelope and validates against ProjectSchema', async () => {
      const mockProject = createMockProject({
        id: 'b2c3d4e5-0002-4000-8000-000000000001',
        name: 'TN Baluran Restorasi',
        region: 'Jawa Timur',
        center: [-7.8385, 114.3725],
      });
      const serverPayload = {
        success: true,
        data: [mockProject],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => serverPayload,
      } as unknown as Response);

      const result = await api.get('/projects', z.array(ProjectSchema));
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b2c3d4e5-0002-4000-8000-000000000001');
      expect(result[0].name).toBe('TN Baluran Restorasi');
      expect(result[0].center).toEqual([-7.8385, 114.3725]);
    });

    it('unwraps NestJS Auth Login response and validates access token and user payload', async () => {
      const serverAuthPayload = createMockAuthResponse({
        token: 'mock-jwt-access-token',
        accessToken: 'mock-jwt-access-token',
        user: {
          id: '00000000-0000-4000-8000-000000000001',
          email: 'admin@rekakarbon.id',
          name: 'Super Admin RekaKarbon',
          role: 'superadmin',
          createdAt: '2026-02-14T08:00:00.000Z',
        },
      });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => serverAuthPayload,
      } as unknown as Response);

      const result = await api.post(
        '/auth/login',
        { email: 'admin@rekakarbon.id', password: 'Password123!' },
        AuthResponseSchema
      );
      expect(result.token).toBe('mock-jwt-access-token');
      expect(result.user.email).toBe('admin@rekakarbon.id');
      expect(result.user.role).toBe('superadmin');
    });

    it('unwraps NestJS Bursa Marketplace item list adhering to BursaItemSchema', async () => {
      const mockBursa = createMockBursaItem({
        id: 'b1c2d3e4-0001-4000-8000-000000000001',
        name: 'Restorasi Mangrove Teluk Benoa',
        category: 'mangrove',
        pricePerTonIDR: 260000,
      });
      const serverBursaPayload = {
        success: true,
        data: [mockBursa],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => serverBursaPayload,
      } as unknown as Response);

      const result = await api.get('/emitter/bursa', z.array(BursaItemSchema));
      expect(result).toHaveLength(1);
      expect(result[0].pricePerTonIDR).toBe(260000);
      expect(result[0].category).toBe('mangrove');
    });

    it('unwraps DJP Carbon Tax Calculation payload seamlessly', async () => {
      const calculation = createMockCarbonTaxCalculation({
        companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
        companyName: 'PT Semen Gresik Pabrik Tuban',
        npwp: '01.234.567.8-012.000',
        actualEmissionTCO2e: 17330,
        quotaPTBAETCO2e: 15000,
        deficitTCO2e: 2330,
        taxRatePerTonIDR: 30000,
        totalTaxPayableIDR: 69900000,
        governingRegulation: 'UU No. 7/2021 (HPP)',
        calculatedAt: '2026-02-14T08:00:00.000Z',
      });
      const serverTaxPayload = {
        success: true,
        data: calculation,
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => serverTaxPayload,
      } as unknown as Response);

      const result = await api.post(
        '/integrations/djp/calculate-tax',
        {},
        CarbonTaxCalculationSchema
      );
      expect(result.deficitTCO2e).toBe(2330);
      expect(result.totalTaxPayableIDR).toBe(69900000);
    });
  });

  describe('Client Schema Validation Enforcement', () => {
    it('throws ApiValidationError when backend response payload violates Zod schema contracts', async () => {
      const invalidPayload = {
        success: true,
        data: [
          {
            id: 'not-a-uuid', // Violates UuidSchema
            name: '',
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => invalidPayload,
      } as unknown as Response);

      await expect(api.get('/projects', z.array(ProjectSchema))).rejects.toThrowError(
        ApiValidationError
      );
    });
  });

  describe('NestJS HttpExceptionFilter Error Envelope Integration', () => {
    it('correctly parses server error envelope { success: false, error: { message } }', async () => {
      const serverErrorPayload = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Email atau kata sandi tidak valid.',
        },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => serverErrorPayload,
      } as unknown as Response);

      await expect(api.post('/auth/login', {})).rejects.toThrow(
        'Email atau kata sandi tidak valid.'
      );
    });
  });

  describe('resolveApiBaseUrl Cross-Device Resolution', () => {
    it('returns empty string when no URL configured', () => {
      expect(resolveApiBaseUrl('')).toBe('');
    });

    it('returns configured URL unchanged when hostname is localhost or 127.0.0.1', () => {
      expect(resolveApiBaseUrl('http://localhost:3000', 'localhost')).toBe('http://localhost:3000');
      expect(resolveApiBaseUrl('http://localhost:3000', '127.0.0.1')).toBe('http://localhost:3000');
    });

    it('dynamically rewrites localhost to LAN IP when client is on another machine on Wi-Fi', () => {
      expect(resolveApiBaseUrl('http://localhost:3000', '192.168.58.209')).toBe(
        'http://192.168.58.209:3000'
      );
      expect(resolveApiBaseUrl('http://127.0.0.1:3000', '10.0.0.15')).toBe('http://10.0.0.15:3000');
    });

    it('preserves production domains and relative paths', () => {
      expect(resolveApiBaseUrl('https://api.rekakarbon.id', 'app.rekakarbon.id')).toBe(
        'https://api.rekakarbon.id'
      );
      expect(resolveApiBaseUrl('/api', '192.168.58.209')).toBe('/api');
    });

    it('automatically resolves to https://api.rekakarbon.farrelad.com when accessed from rekakarbon.farrelad.com and no explicit URL configured or set to localhost', () => {
      expect(resolveApiBaseUrl('', 'rekakarbon.farrelad.com')).toBe(
        'https://api.rekakarbon.farrelad.com'
      );
      expect(resolveApiBaseUrl('http://localhost:3000', 'rekakarbon.farrelad.com')).toBe(
        'https://api.rekakarbon.farrelad.com'
      );
      expect(resolveApiBaseUrl('https://custom-api.farrelad.com', 'rekakarbon.farrelad.com')).toBe(
        'https://custom-api.farrelad.com'
      );
    });
  });
});
