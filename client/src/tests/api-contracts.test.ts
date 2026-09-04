import { describe, it, expect, vi, afterEach } from 'vitest';
import { api, ApiValidationError } from '../lib/api';
import {
  AuthResponseSchema,
  ProjectSchema,
  BursaItemSchema,
  CarbonTaxCalculationSchema,
} from '../schemas';
import { z } from 'zod';

describe('Client-Side API Contract & Envelope Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('NestJS TransformInterceptor Envelope Integration', () => {
    it('unwraps NestJS { success: true, data } envelope and validates against ProjectSchema', async () => {
      const serverPayload = {
        success: true,
        data: [
          {
            id: 'b2c3d4e5-0002-4000-8000-000000000001',
            name: 'TN Baluran Restorasi',
            region: 'Jawa Timur',
            center: [-7.8385, 114.3725],
            zoom: 12,
            area: 25000,
            rawAreaVal: 25000,
            carbon: 1240000,
            rawCarbonVal: 1240000,
            ndvi: 0.78,
            evi: 0.61,
            coordinates: [{ lat: -7.732, lng: 114.398 }],
            trendLabels: ['2021', '2022'],
            trendData: [1.15, 1.18],
            survivalRate: 0.875,
            canopyHeight: 1.85,
            bufferAllocated: 0.08,
            bufferUsed: 0.0,
            reforestationStatus: 'Sangat Baik',
            reforestationPartner: 'Dinas Kehutanan Jawa Timur & Balai TN Baluran',
            reforestationSite: 'Lahan Uji Coba Cangar, Malang',
            targetTrees: 200000,
            plantedTrees: 174000,
            remainingTrees: 26000,
            carbonPricePerTon: 260000,
            totalBudget: 4850000000,
            disbursedBudget: 3750000000,
            remainingBudget: 1100000000,
            currentYear: 4,
            stages: [
              {
                year: 1,
                title: 'Tahun 1: Pembibitan',
                milestone: 'Pengadaan bibit',
                status: 'completed',
                canopyDensity: 28,
                gsd: 2.5,
                kthName: 'KTH Bina Wana Baluran',
                farmerIncentive: 120000000,
                incentiveStatus: 'Telah Disalurkan',
                speCreditMinted: 800,
                speStatus: 'Terbit (Minted)',
              },
            ],
            disbursementHistory: [
              {
                id: 'd1e2f3a4-0001-4000-8000-000000000001',
                date: '2026-02-14',
                amount: 150000000,
                category: 'Restorasi',
                desc: 'Insentif',
                txHash: '0x8f3a9b2c1d4e7f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
                blockNumber: '#184920',
                vendor: 'KTH Baluran',
              },
            ],
            tokenBuyers: [
              {
                id: 't1e2f3a4-0001-4000-8000-000000000001',
                companyName: 'PT Semen Indonesia',
                sector: 'Manufaktur',
                tCO2e: 1200,
                amountIDR: 312000000,
                purchaseDate: '2026-02-14',
                speCertificateId: 'SPE-BALURAN-2025-001',
                txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
                blockNumber: '#184410',
                verificationStatus: 'Terverifikasi',
                auditor: 'Sucofindo',
              },
            ],
          },
        ],
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
      const serverAuthPayload = {
        success: true,
        data: {
          token: 'mock-jwt-access-token',
          accessToken: 'mock-jwt-access-token',
          role: 'superadmin',
          user: {
            id: '00000000-0000-4000-8000-000000000001',
            email: 'admin@rekakarbon.id',
            role: 'superadmin',
            name: 'Super Admin RekaKarbon',
            createdAt: '2026-02-14T08:00:00.000Z',
          },
        },
      };

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
      const serverBursaPayload = {
        success: true,
        data: [
          {
            id: 'b1c2d3e4-0001-4000-8000-000000000001',
            name: 'Restorasi Mangrove Teluk Benoa',
            verified: true,
            category: 'mangrove',
            categoryLabel: 'Mangrove & Coastal Blue Carbon',
            location: 'Bali',
            pricePerTonIDR: 260000,
            change24h: 3.8,
            volumeAvailableTCO2e: 4500,
            supplyPercent: 78.5,
          },
        ],
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
      const serverTaxPayload = {
        success: true,
        data: {
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
        },
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
});
