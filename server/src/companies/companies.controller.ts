import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CompanyQueryDto } from './dto';

@ApiTags('Companies & Emitters')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @ApiOperation({
    summary: 'Retrieve directory of all registered enterprise emitters',
  })
  @ApiResponse({
    status: 200,
    description: 'Companies list retrieved successfully.',
  })
  @Get()
  async getCompanies(@Query() _query: CompanyQueryDto) {
    const companies = await this.companiesService.findAll();
    return {
      success: true,
      data: companies,
    };
  }

  @ApiOperation({
    summary: 'Retrieve single company profile and compliance standing by ID',
  })
  @ApiParam({
    name: 'id',
    example: 'a1b2c3d4-0001-4000-8000-000000000001',
    description: 'Company UUID identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Company record found.',
  })
  @ApiResponse({
    status: 404,
    description: 'Company with specified ID not found.',
  })
  @Get(':id')
  async getCompanyById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
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
