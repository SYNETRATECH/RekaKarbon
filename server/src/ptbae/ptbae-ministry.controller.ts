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
import { PtbaeMinistryDecisionDto, PtbaeRevisionDto } from './dto';
import { PtbaeService } from './ptbae.service';

@ApiTags('PTBAE-PU Ministry')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ministry, Role.superadmin)
@Controller('ministry/ptbae-applications')
export class PtbaeMinistryController {
  constructor(private readonly ptbaeService: PtbaeService) {}

  @ApiOperation({
    summary: 'Retrieve PTBAE-PU applications for ministry review',
  })
  @ApiResponse({ status: 200, description: 'Ministry queue retrieved.' })
  @Get()
  async getQueue(@Query('complianceYear') complianceYear?: string) {
    const year = complianceYear ? Number(complianceYear) : undefined;
    const data = await this.ptbaeService.getMinistryQueue(year);
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Retrieve a PTBAE-PU application for ministry review',
  })
  @ApiResponse({ status: 200, description: 'Ministry application retrieved.' })
  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const data = await this.ptbaeService.getMinistryApplication(id);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Request revision from an emitter' })
  @ApiResponse({ status: 200, description: 'Revision requested.' })
  @Post(':id/request-revision')
  async requestRevision(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: PtbaeRevisionDto,
  ) {
    const data = await this.ptbaeService.requestMinistryRevision(
      request.user,
      id,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Reject a PTBAE-PU application' })
  @ApiResponse({ status: 200, description: 'PTBAE-PU application rejected.' })
  @Post(':id/reject')
  async reject(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: PtbaeRevisionDto,
  ) {
    const data = await this.ptbaeService.rejectMinistryApplication(
      request.user,
      id,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Approve and issue official PTBAE-PU quota' })
  @ApiResponse({ status: 200, description: 'PTBAE-PU quota issued.' })
  @Post(':id/approve')
  async approve(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: PtbaeMinistryDecisionDto,
  ) {
    const data = await this.ptbaeService.approveMinistryApplication(
      request.user,
      id,
      dto,
    );
    return { success: true, data };
  }
}
