import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import {
  CreatePtbaeApplicationDto,
  UpdatePtbaeApplicationDto,
  UploadPtbaeDocumentDto,
} from './dto';
import { PtbaeService } from './ptbae.service';

@ApiTags('PTBAE-PU Emitter Applications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.emitter, Role.superadmin)
@Controller('ptbae-applications')
export class PtbaeController {
  constructor(private readonly ptbaeService: PtbaeService) {}

  @ApiOperation({
    summary: 'Retrieve PTBAE-PU applications owned by the emitter',
  })
  @ApiResponse({ status: 200, description: 'Emitter applications retrieved.' })
  @Get('mine')
  async getMine(@Req() request: AuthenticatedRequest) {
    const data = await this.ptbaeService.getEmitterApplications(request.user);
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Create or update a PTBAE-PU application draft' })
  @ApiResponse({ status: 201, description: 'PTBAE-PU draft saved.' })
  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePtbaeApplicationDto,
  ) {
    const data = await this.ptbaeService.createOrUpdateEmitterApplication(
      request.user,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Retrieve one PTBAE-PU application' })
  @ApiResponse({ status: 200, description: 'PTBAE-PU application retrieved.' })
  @Get(':id')
  async getOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.ptbaeService.getEmitterApplication(
      request.user,
      id,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Update a PTBAE-PU application draft or revision' })
  @ApiResponse({ status: 200, description: 'PTBAE-PU application updated.' })
  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdatePtbaeApplicationDto,
  ) {
    const data = await this.ptbaeService.updateEmitterApplication(
      request.user,
      id,
      dto,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Upload a supporting document for a PTBAE-PU application',
  })
  @ApiResponse({ status: 201, description: 'Supporting document uploaded.' })
  @Post(':id/documents')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadDocuments(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UploadPtbaeDocumentDto,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal satu dokumen wajib diunggah.');
    }
    const data = await this.ptbaeService.uploadEmitterDocuments(
      request.user,
      id,
      dto.documentType,
      files,
    );
    return { success: true, data };
  }

  @ApiOperation({
    summary: 'Submit a completed PTBAE-PU application for audit',
  })
  @ApiResponse({ status: 200, description: 'PTBAE-PU application submitted.' })
  @Post(':id/submit')
  async submit(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.ptbaeService.submitEmitterApplication(
      request.user,
      id,
    );
    return { success: true, data };
  }

  @ApiOperation({ summary: 'Filter emitter PTBAE-PU applications by year' })
  @ApiResponse({ status: 200, description: 'PTBAE-PU applications filtered.' })
  @Get()
  async getByYear(
    @Req() request: AuthenticatedRequest,
    @Query('complianceYear') complianceYear?: string,
  ) {
    const applications = await this.ptbaeService.getEmitterApplications(
      request.user,
    );
    const year = complianceYear ? Number(complianceYear) : undefined;
    const data = year
      ? applications.filter(
          (application) => application.complianceYear === year,
        )
      : applications;
    return { success: true, data };
  }
}
