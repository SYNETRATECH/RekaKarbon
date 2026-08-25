import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class BursaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by carbon credit category',
    example: 'mangrove',
    enum: ['mangrove', 'hutan', 'gambut'],
  })
  @IsString()
  @IsOptional()
  category?: 'mangrove' | 'hutan' | 'gambut';

  @ApiPropertyOptional({
    description: 'Filter by listing location/province',
    example: 'Kalimantan Timur',
  })
  @IsString()
  @IsOptional()
  location?: string;
}
