import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class RegulatorQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by province/region',
    example: 'Jawa Timur',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    example: 'verified',
  })
  @IsString()
  @IsOptional()
  verificationStatus?: string;
}
