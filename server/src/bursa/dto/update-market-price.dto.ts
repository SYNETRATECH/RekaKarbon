import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdateMarketPriceDto {
  @ApiProperty({
    description: 'New Bursa market price per tCO2e in whole IDR',
    example: 275000,
  })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  marketPricePerTonIDR!: number;
}
