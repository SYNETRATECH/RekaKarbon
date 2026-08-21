import type { StpDocument, CarbonTaxCalculation } from '../../types/tax';

export const MOCK_TAX_CALCULATIONS: CarbonTaxCalculation[] = [
  {
    companyId: 'a1b2c3d4-0001-4000-8000-000000000002',
    companyName: 'PT Semen Nusantara Tuban',
    npwp: '01.234.567.8-012.000',
    actualEmissionTCO2e: 14830,
    quotaPTBAETCO2e: 12500,
    deficitTCO2e: 2330,
    taxRatePerTonIDR: 650000,
    totalTaxPayableIDR: 1514500000,
    governingRegulation: 'UU No. 7/2021 (HPP) & Permen LHK 21/2022',
    calculatedAt: '2026-02-14T10:00:00.000Z',
  },
];

export const MOCK_STP_DOCUMENTS: StpDocument[] = [
  {
    id: 'e1f2a3b4-0070-4000-8000-000000000001',
    stpDocNumber: 'STP-DJP-2026-001',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000002',
    companyName: 'PT Semen Nusantara Tuban',
    npwp: '01.234.567.8-012.000',
    taxYear: 2026,
    totalTaxDueIDR: 1514500000,
    dueDate: '2026-12-31',
    paymentStatus: 'unpaid',
    issuedAt: '2026-02-01T09:15:00.000Z',
  },
  {
    id: 'e1f2a3b4-0070-4000-8000-000000000002',
    stpDocNumber: 'STP-DJP-2025-088',
    companyId: 'a1b2c3d4-0001-4000-8000-000000000001',
    companyName: 'PLTU Suralaya (Unit 1-8)',
    npwp: '02.345.678.9-023.000',
    taxYear: 2025,
    totalTaxDueIDR: 72000000000,
    dueDate: '2025-12-31',
    paymentStatus: 'unpaid',
    issuedAt: '2025-12-01T14:30:00.000Z',
  },
];
