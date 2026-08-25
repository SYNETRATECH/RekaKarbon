import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateMultiSigRequestDto {
  @ApiProperty({
    description: 'Transaction category type',
    example: 'MINT_CREDIT',
  })
  @IsString()
  @IsNotEmpty()
  requestType!: string;

  @ApiProperty({
    description: 'Human-readable description of authorization request',
    example: 'Otorisasi pencetakan 48.750 tCO2e kredit karbon Baluran',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Required number of multi-sig signers',
    example: 2,
    default: 2,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  requiredSigners?: number;

  @ApiPropertyOptional({
    description: 'Transaction funding amount in IDR',
    example: 12500000000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  amountIDR?: number;

  @ApiPropertyOptional({
    description: 'Transaction carbon volume in tCO2e',
    example: 48750,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  volumeTCO2e?: number;
}
