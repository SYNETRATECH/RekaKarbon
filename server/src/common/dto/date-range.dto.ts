import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter start date in ISO 8601 format (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string (YYYY-MM-DD)' },
  )
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter end date in ISO 8601 format (YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsDateString(
    {},
    { message: 'endDate must be a valid ISO 8601 date string (YYYY-MM-DD)' },
  )
  @IsOptional()
  endDate?: string;
}
