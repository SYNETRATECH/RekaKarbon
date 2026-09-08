import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Bursa listing UUID identifier',
    example: 'b1c2d3e4-0001-4000-8000-000000000001',
  })
  @IsUUID('4', { message: 'listingId must be a valid UUIDv4' })
  @IsNotEmpty()
  listingId!: string;

  @ApiProperty({
    description: 'Volume in tCO2e to purchase',
    example: 100,
  })
  @IsNumber()
  @IsPositive({ message: 'volumeTCO2e must be positive' })
  volumeTCO2e!: number;

  @ApiPropertyOptional({
    description:
      'Stable client request identifier used to make retries idempotent',
    example: 'b1c2d3e4-0001-4000-8000-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'requestId must be a valid UUIDv4' })
  requestId?: string;
}
