import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  async getCompanies() {
    const companies = await this.companiesService.findAll();
    return {
      success: true,
      data: companies,
    };
  }

  @Get(':id')
  async getCompanyById(@Param('id') id: string) {
    const company = await this.companiesService.findById(id);
    if (!company) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: `Company with ID '${id}' was not found.`,
        },
      });
    }
    return {
      success: true,
      data: company,
    };
  }
}
