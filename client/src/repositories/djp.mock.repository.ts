import type { CarbonTaxCalculation, StpDocument, CalculateTaxDto, IssueStpDto } from '../types/tax';
import type { DjpRepository } from './djp.repository';

export class MockDjpRepository implements DjpRepository {
  private stpList: StpDocument[] = [
    {
      id: 'e1f2a3b4-0070-4000-8000-111111111111',
      stpDocNumber: 'STP-DJP-2026-9921',
      companyId: 'c1a2b3c4-0010-4000-8000-111111111111',
      companyName: 'PT Semen Nusantara Tuban',
      npwp: '01.234.567.8-012.000',
      taxYear: 2026,
      totalTaxDueIDR: 442000000,
      dueDate: '2026-12-31',
      paymentStatus: 'unpaid',
      issuedAt: '2026-02-14T09:00:00.000Z',
    },
  ];

  async calculateTax(data: CalculateTaxDto): Promise<CarbonTaxCalculation> {
    const rate = data.taxRatePerTonIDR ?? 650000;
    const deficit = Math.max(0, data.actualEmissionTCO2e - data.quotaPTBAETCO2e);
    return Promise.resolve({
      companyId: data.companyId,
      companyName: 'PT Semen Nusantara Tuban',
      npwp: '01.234.567.8-012.000',
      actualEmissionTCO2e: data.actualEmissionTCO2e,
      quotaPTBAETCO2e: data.quotaPTBAETCO2e,
      deficitTCO2e: deficit,
      taxRatePerTonIDR: rate,
      totalTaxPayableIDR: deficit * rate,
      governingRegulation: 'UU No. 7/2021 (HPP) & Permen LHK 21/2022',
      calculatedAt: new Date().toISOString(),
    });
  }

  async issueStp(data: IssueStpDto): Promise<StpDocument> {
    const stp: StpDocument = {
      id: `mock-stp-${Date.now()}`,
      stpDocNumber: `STP-DJP-${data.taxYear}-${Math.floor(Math.random() * 8999 + 1000)}`,
      companyId: data.companyId,
      companyName: 'Target Taxpayer Emitter',
      npwp: '01.234.567.8-012.000',
      taxYear: data.taxYear,
      totalTaxDueIDR: data.totalTaxDueIDR,
      dueDate: `${data.taxYear}-12-31`,
      paymentStatus: 'unpaid',
      issuedAt: new Date().toISOString(),
    };
    this.stpList.unshift(stp);
    return Promise.resolve(stp);
  }

  async getTaxHistory(companyId: string): Promise<StpDocument[]> {
    return Promise.resolve(this.stpList.filter((s) => s.companyId === companyId));
  }
}
