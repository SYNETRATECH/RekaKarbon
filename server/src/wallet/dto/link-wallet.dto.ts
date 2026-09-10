import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsString, IsUUID, Matches } from 'class-validator';

export class LinkWalletDto {
  @ApiProperty({ description: 'Challenge identifier returned by the API.' })
  @IsUUID()
  challengeId!: string;

  @ApiProperty({
    description: 'EVM address recovered from the embedded wallet signature.',
    example: '0x0000000000000000000000000000000000000001',
  })
  @IsEthereumAddress()
  walletAddress!: string;

  @ApiProperty({ description: 'Hex-encoded EIP-191 signature.' })
  @IsString()
  @Matches(/^0x[0-9a-fA-F]{130}$/, {
    message: 'Signature wallet harus berupa signature EVM 65-byte yang valid.',
  })
  signature!: string;
}
