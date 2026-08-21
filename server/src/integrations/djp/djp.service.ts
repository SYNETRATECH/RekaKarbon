import { Injectable } from '@nestjs/common';
import type { CarbonTaxCalculation, StpDocument } from '../../types/tax';
import { MOCK_TAX_CALCULATIONS, MOCK_STP_DOCUMENTS } from './djp.mock';
import type { CalculateTaxDto, IssueStpDto } from './dto';

@Injectable()
export class DjpService {
  private readonly taxCalculations: CarbonTaxCalculation[] = [
    ...MOCK_TAX_CALCULATIONS,
  ];
  private readonly stpDocuments: StpDocument[] = [...MOCK_STP_DOCUMENTS];

  getTaxHistory(companyId: string): Promise<StpDocument[]> {
    return Promise.resolve(
      this.stpDocuments.filter((d) => d.companyId === companyId),
    );
  }

  calculateTax(dto: CalculateTaxDto): Promise<CarbonTaxCalculation> {
    const rate = dto.taxRatePerTonIDR ?? 650000;
    const deficit = Math.max(0, dto.actualEmissionTCO2e - dto.quotaPTBAETCO2e);
    const totalTax = deficit * rate;

    const calculation: CarbonTaxCalculation = {
      companyId: dto.companyId,
      companyName: 'Assessed Company Entity',
      npwp: '01.234.567.8-012.000',
      actualEmissionTCO2e: dto.actualEmissionTCO2e,
      quotaPTBAETCO2e: dto.quotaPTBAETCO2e,
      deficitTCO2e: deficit,
      taxRatePerTonIDR: rate,
      totalTaxPayableIDR: totalTax,
      governingRegulation: 'UU No. 7/2021 (HPP) & Permen LHK 21/2022',
      calculatedAt: new Date().toISOString(),
    };
    this.taxCalculations.unshift(calculation);
    return Promise.resolve(calculation);
  }

  issueStp(dto: IssueStpDto): Promise<StpDocument> {
    const randomHex = Math.floor(Math.random() * 89999 + 10000);
    const stpNumber = `STP-DJP-${dto.taxYear}-${randomHex}`;
    const stp: StpDocument = {
      id: `e1f2a3b4-0070-4000-8000-${randomHex}000000`,
      stpDocNumber: stpNumber,
      companyId: dto.companyId,
      companyName: 'Target Taxpayer Emitter',
      npwp: '01.234.567.8-012.000',
      taxYear: dto.taxYear,
      totalTaxDueIDR: dto.totalTaxDueIDR,
      dueDate: `${dto.taxYear}-12-31`,
      paymentStatus: 'unpaid',
      issuedAt: new Date().toISOString(),
    };
    this.stpDocuments.unshift(stp);
    return Promise.resolve(stp);
  }
}
