import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VerifyAnomalyDto {
  @ApiPropertyOptional({
    description: 'Auditor verification notes and rationale',
    example:
      'Telah dilakukan cross-check terhadap telemetri CEMS dan load listrik.',
  })
  @IsString()
  @IsOptional()
  verifierNotes?: string;
}
