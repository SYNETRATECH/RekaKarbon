import { PtbaeStatus } from '@prisma/client';
import { PtbaeService } from './ptbae.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('PtbaeService', () => {
  const findAllocation = jest.fn();
  const findCompany = jest.fn();
  const upsertAllocation = jest.fn();
  const prisma = {
    ptbaeAllocation: { findUnique: findAllocation, upsert: upsertAllocation },
    company: { findUnique: findCompany },
  } as unknown as PrismaService;
  const service = new PtbaeService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the verified company/year allocation as the quota source', async () => {
    findAllocation.mockResolvedValue({
      quotaTco2e: 100000,
      status: PtbaeStatus.VERIFIED,
      sourceDocument: 'SK_PTBAE_2026.pdf',
    });

    await expect(
      service.resolveForCompany('company-id', 2026),
    ).resolves.toEqual({
      complianceYear: 2026,
      quotaTCO2e: 100000,
      status: 'VERIFIED',
      sourceDocument: 'SK_PTBAE_2026.pdf',
      isOfficial: true,
    });
    expect(findCompany).not.toHaveBeenCalled();
  });

  it('falls back to the legacy company cap when no annual allocation exists', async () => {
    findAllocation.mockResolvedValue(null);
    findCompany.mockResolvedValue({ emissionCapTco2e: 500000 });

    await expect(
      service.resolveForCompany('company-id', 2026),
    ).resolves.toMatchObject({
      quotaTCO2e: null,
      status: 'LEGACY',
      isOfficial: false,
    });
  });

  it('does not use a pending allocation as an active quota', async () => {
    findAllocation.mockResolvedValue({
      quotaTco2e: 100000,
      status: PtbaeStatus.PENDING,
      sourceDocument: 'Pengajuan belum disahkan',
    });

    await expect(
      service.resolveForCompany('company-id', 2026),
    ).resolves.toMatchObject({
      quotaTCO2e: null,
      status: 'PENDING',
      isOfficial: false,
    });
    expect(findCompany).not.toHaveBeenCalled();
  });

  it('returns null deficit when the PTBAE-PU quota is unavailable', () => {
    expect(service.calculateDeficit(12000, null)).toBeNull();
    expect(service.calculateDeficit(12000, 10000)).toBe(2000);
    expect(service.calculateDeficit(8000, 10000)).toBe(0);
  });
});
