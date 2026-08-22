import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DjpService } from './djp.service';
import { CalculateTaxDto, IssueStpDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Integrations — DJP Carbon Tax Engine')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.REGULATOR_KLHK, Role.CORPORATE_EMITTER, Role.SUPER_ADMIN)
@Controller('integrations/djp')
export class DjpController {
  constructor(private readonly djpService: DjpService) {}

  @ApiOperation({
    summary:
      'Calculate mandatory carbon tax liability under Indonesian UU HPP 7/2021',
  })
  @ApiResponse({
    status: 200,
    description: 'Carbon tax liability calculated successfully.',
  })
  @Post('calculate-tax')
  async calculateTax(@Body() dto: CalculateTaxDto) {
    const calculation = await this.djpService.calculateTax(dto);
    return { success: true, data: calculation };
  }

  @ApiOperation({
    summary: 'Issue official DJP Surat Tagihan Pajak (STP) billing invoice',
  })
  @ApiResponse({
    status: 201,
    description: 'STP billing invoice issued.',
  })
  @Post('issue-stp')
  async issueStp(@Body() dto: IssueStpDto) {
    const stp = await this.djpService.issueStp(dto);
    return { success: true, data: stp };
  }

  @ApiOperation({
    summary: 'Retrieve historical tax billing notices (STP) by company ID',
  })
  @ApiParam({ name: 'companyId', description: 'Company UUID identifier' })
  @ApiResponse({ status: 200, description: 'Tax history retrieved.' })
  @Get('tax-history/:companyId')
  async getTaxHistory(@Param('companyId') companyId: string) {
    const history = await this.djpService.getTaxHistory(companyId);
    return { success: true, data: history };
  }
}
