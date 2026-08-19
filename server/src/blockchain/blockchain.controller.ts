import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { BlockchainService } from './blockchain.service';

@Controller('api/carbon')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get('balance/:address/:tokenId')
  async getBalance(
    @Param('address') address: string,
    @Param('tokenId', ParseIntPipe) tokenId: number,
  ) {
    const balance = await this.blockchainService.getCarbonBalance(
      address,
      tokenId,
    );
    return { success: true, balance };
  }

  @Post('mint')
  async mintCarbon(
    @Body() body: { targetAddress: string; amount: number; coords: string },
  ) {
    const txHash = await this.blockchainService.mintOffsetCredit(
      body.targetAddress,
      body.amount,
      body.coords,
    );

    return {
      success: true,
      message: 'Carbon certificate successfully published on blockchain!',
      transactionHash: txHash,
    };
  }
}
