import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum EmissionReportAuditDecision {
  APPROVE = 'approve',
  REQUEST_REVISION = 'request_revision',
}

export class AuditEmissionReportDecisionDto {
  @ApiProperty({
    enum: EmissionReportAuditDecision,
    example: EmissionReportAuditDecision.APPROVE,
  })
  @IsEnum(EmissionReportAuditDecision)
  decision!: EmissionReportAuditDecision;

  @ApiPropertyOptional({
    description: 'Catatan keputusan Auditor. Wajib diisi saat meminta revisi.',
    example: 'Mohon lengkapi bukti konsumsi bahan bakar Scope 1.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  notes?: string;
}
