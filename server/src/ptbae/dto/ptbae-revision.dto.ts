import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PtbaeRevisionDto {
  @ApiPropertyOptional({
    example: 'Mohon unggah baseline emisi yang telah ditandatangani.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
