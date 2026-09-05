import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({
    description:
      'Verified and blockchain-minted CarbonToken UUID to publish into Bursa escrow',
    example: 'c3d4e5f6-0003-4000-8000-000000000001',
  })
  @IsUUID('4', { message: 'carbonTokenId must be a valid UUIDv4' })
  @IsNotEmpty()
  carbonTokenId!: string;
}
