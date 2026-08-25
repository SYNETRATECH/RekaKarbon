import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CompanyQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by industrial sector (e.g. Semen, Petrokimia, PLTU)',
    example: 'Semen & Manufaktur',
  })
  @IsString()
  @IsOptional()
  sector?: string;

  @ApiPropertyOptional({
    description: 'Filter by operational region/province',
    example: 'Jawa Timur',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Filter by compliance rating',
    example: 'compliant',
    enum: ['compliant', 'warning', 'non_compliant'],
  })
  @IsString()
  @IsOptional()
  complianceRating?: 'compliant' | 'warning' | 'non_compliant';
}
