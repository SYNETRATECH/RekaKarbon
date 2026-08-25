import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateDepositDto {
  @ApiProperty({
    description: 'Amount in IDR to deposit into wallet',
    example: 500000,
    minimum: 10000,
  })
  @IsNumber()
  @Min(10000, { message: 'Minimum deposit is Rp 10.000' })
  amountIDR!: number;
}
