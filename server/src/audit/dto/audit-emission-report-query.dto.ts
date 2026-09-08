import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum EmissionReportAuditQueueStatus {
  ALL = 'all',
  SUBMITTED = 'submitted',
  REVISION_REQUIRED = 'revision_required',
  APPROVED = 'approved',
}

export class AuditEmissionReportQueryDto {
  @ApiPropertyOptional({ enum: EmissionReportAuditQueueStatus })
  @IsOptional()
  @IsEnum(EmissionReportAuditQueueStatus)
  status?: EmissionReportAuditQueueStatus;
}
