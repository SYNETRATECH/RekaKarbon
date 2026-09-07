import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class TriggerMlRetrainDto {
  @ApiPropertyOptional({
    description:
      'Force retraining regardless of drift thresholds or time-based schedules',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;

  @ApiPropertyOptional({
    description:
      'Dry run — checks data drift and prerequisites without swapping the active model artifact',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;
}
