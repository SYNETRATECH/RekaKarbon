import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class CertificateQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by certificate number or reference code',
    example: 'SPE-BALURAN-2026-001',
  })
  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by project category',
    example: 'mangrove',
  })
  @IsString()
  @IsOptional()
  category?: string;
}
