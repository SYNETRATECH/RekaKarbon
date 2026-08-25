import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class RetireCarbonDto {
  @ApiProperty({
    description: 'The UUID of the carbon token in the database',
    example: 'b1c2d3e4-0001-4000-8000-000000000001',
  })
  @IsUUID('4', { message: 'tokenId must be a valid UUIDv4' })
  @IsNotEmpty()
  tokenId!: string;

  @ApiProperty({
    description: 'Volume in tCO2e to retire',
    example: 100,
  })
  @IsNumber()
  @IsPositive({ message: 'volumeTco2e must be positive' })
  volumeTco2e!: number;
}
