import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types';

const MOCK_WALLET_ADDRESS = '0x7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B';

@ApiTags('Wallet / Credit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emitter/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({ summary: 'Create Xendit deposit invoice to top-up wallet' })
  @ApiResponse({ status: 201, description: 'Invoice URL created' })
  @Post('deposit')
  async createDeposit(
    @Body() dto: CreateDepositDto,
    @Req() req: AuthenticatedRequest,
  ) {
    // Di real-app ambil dari req.user.walletAddress, di sini mock address
    const userAddress = req.user.walletAddress ?? MOCK_WALLET_ADDRESS;
    const result = await this.walletService.createDeposit(
      userAddress,
      dto.amountIDR,
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({ summary: 'Get current wallet balance (RKB_CREDIT)' })
  @ApiResponse({ status: 200, description: 'Returns balance' })
  @Get('balance')
  async getBalance(@Req() req: AuthenticatedRequest) {
    const userAddress = req.user.walletAddress ?? MOCK_WALLET_ADDRESS;
    const balance = await this.walletService.getBalance(userAddress);
    return {
      success: true,
      data: {
        address: userAddress,
        balance,
      },
    };
  }

  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({ status: 200, description: 'Returns array of transactions' })
  @Get('history')
  async getHistory(@Req() req: AuthenticatedRequest) {
    const userAddress = req.user.walletAddress ?? MOCK_WALLET_ADDRESS;
    const history = await this.walletService.getHistory(userAddress);
    return {
      success: true,
      data: history,
    };
  }
}
