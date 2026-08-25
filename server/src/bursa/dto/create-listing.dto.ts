import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateListingDto {
  @ApiProperty({
    description: 'Carbon token UUID identifier',
    example: 'c3d4e5f6-0003-4000-8000-000000000001',
  })
  @IsUUID('4', { message: 'carbonTokenId must be a valid UUIDv4' })
  @IsNotEmpty()
  carbonTokenId!: string;

  @ApiProperty({
    description: 'Carbon project name for listing display',
    example: 'TN Baluran Restorasi Mangrove',
  })
  @IsString()
  @IsNotEmpty()
  projectName!: string;

  @ApiProperty({
    description: 'Available volume in tCO2e for trade',
    example: 5000,
  })
  @IsNumber()
  @IsPositive({ message: 'volumeAvailableTCO2e must be positive' })
  volumeAvailableTCO2e!: number;

  @ApiProperty({
    description: 'Price per ton in IDR',
    example: 260000,
  })
  @IsNumber()
  @IsPositive({ message: 'pricePerTonIDR must be positive' })
  pricePerTonIDR!: number;
}
