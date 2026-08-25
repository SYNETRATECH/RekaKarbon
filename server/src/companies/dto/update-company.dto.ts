import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Company registered business name',
    example: 'PT Semen Nusantara Tbk',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Annual emission cap in tCO2e',
    example: 50000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  emissionCap?: number;

  @ApiPropertyOptional({
    description: 'Company PIC Auditor Name',
    example: 'Ir. Hendro Wibowo, M.Sc.',
  })
  @IsString()
  @IsOptional()
  picAuditor?: string;

  @ApiPropertyOptional({
    description: 'Company operational description',
    example:
      'Pabrik manufaktur semen dan bahan bangunan terintegrasi di Tuban.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
