import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum ForestInspectionAuditDecision {
  APPROVE = 'approve',
  REQUEST_REVISION = 'request_revision',
}

export class ForestInspectionDecisionDto {
  @ApiProperty({ enum: ForestInspectionAuditDecision })
  @IsEnum(ForestInspectionAuditDecision)
  decision!: ForestInspectionAuditDecision;

  @ApiPropertyOptional({
    description: 'Nilai serapan hasil verifikasi Auditor.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  verifiedSequestrationTCO2e?: number;

  @ApiPropertyOptional({
    description: 'Catatan verifikasi atau permintaan revisi.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  notes?: string;
}
