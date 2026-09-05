import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum ForestProjectAuditDecision {
  APPROVE = 'approve',
  REQUEST_REVISION = 'request_revision',
}

export class ForestProjectAuditDecisionDto {
  @ApiProperty({ enum: ForestProjectAuditDecision })
  @IsEnum(ForestProjectAuditDecision)
  decision!: ForestProjectAuditDecision;

  @ApiPropertyOptional({
    description: 'Catatan verifikasi atau alasan permintaan revisi.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  notes?: string;
}
