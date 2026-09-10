import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';

export class CreateWalletLinkChallengeDto {
  @ApiProperty({
    description: 'Wallet address that will sign the challenge.',
    example: '0x0000000000000000000000000000000000000001',
  })
  @IsEthereumAddress()
  walletAddress!: string;
}
