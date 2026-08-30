import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PtbaeAuditDecisionDto } from './dto';
import { PtbaeService } from './ptbae.service';

@ApiTags('PTBAE-PU Auditor Review')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.auditor, Role.superadmin)
@Controller('audit/ptbae-applications')
export class PtbaeAuditController {
  constructor(private readonly ptbaeService: PtbaeService) {}

  @ApiOperation({ summary: 'Retrieve PTBAE-PU applications awaiting audit' })
  @ApiResponse({ status: 200, description: 'Audit queue retrieved.' })
  @Get()
  async getQueue(@Query('complianceYear') complianceYear?: string) {
    const year = complianceYear ? Number(complianceYear) : undefined;
    const data = await this.ptbaeService.getAuditQueue(year);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve a PTBAE-PU application for audit' })
  @ApiResponse({ status: 200, description: 'Audit application retrieved.' })
  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const data = await this.ptbaeService.getAuditApplication(id);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Record auditor decision on a PTBAE-PU application',
  })
  @ApiResponse({ status: 200, description: 'Auditor decision recorded.' })
  @Post(':id/decision')
  async decide(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: PtbaeAuditDecisionDto,
  ) {
    const data = await this.ptbaeService.decideAuditApplication(
      request.user,
      id,
      dto,
    );
    return { success: true, data };
  }
}
