import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class SubmitEmissionDto {
  @ApiProperty({
    description: 'Target company UUID identifier',
    example: 'a1b2c3d4-0001-4000-8000-000000000001',
  })
  @IsUUID('4', { message: 'companyId must be a valid UUIDv4' })
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
    description: 'Reporting tax or calendar year',
    example: 2026,
  })
  @IsInt()
  @Min(2020)
  @Max(2050)
  reportingYear!: number;

  @ApiProperty({
    description: 'Verified actual emissions in tCO2e',
    example: 48500,
  })
  @IsNumber()
  @IsPositive()
  actualEmissionsTCO2e!: number;

  @ApiProperty({
    description: 'Assigned PTBAE cap quota in tCO2e',
    example: 40000,
  })
  @IsNumber()
  @IsPositive()
  quotaPTBAETCO2e!: number;
}
