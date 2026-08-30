import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class IssueStpDto {
  @ApiProperty({
    example: 'a1b2c3d4-0001-4000-8000-000000000002',
    description: 'Company UUID identifier',
  })
  @IsUUID('4', { message: 'Company ID harus berupa UUID v4 yang valid.' })
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
    example: 2026,
    description: 'Tax assessment fiscal year',
  })
  @IsNumber()
  taxYear!: number;

  @ApiProperty({
    example: 1514500000,
    description: 'Total calculated tax liability in IDR',
  })
  @IsNumber()
  @IsPositive()
  totalTaxDueIDR!: number;
}
