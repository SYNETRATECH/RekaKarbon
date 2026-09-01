import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PtbaeAuditDecision {
  APPROVE = 'approve',
  REQUEST_REVISION = 'request_revision',
}

export class PtbaeAuditDecisionDto {
  @ApiProperty({ enum: PtbaeAuditDecision })
  @IsEnum(PtbaeAuditDecision)
  decision!: PtbaeAuditDecision;

  @ApiPropertyOptional({
    example: 'Data baseline dan dokumen teknis telah sesuai untuk diteruskan.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
