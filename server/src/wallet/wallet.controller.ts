import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWalletLinkChallengeDto } from './dto/create-wallet-link-challenge.dto';
import { LinkWalletDto } from './dto/link-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../auth/types';
import { UsersService } from '../users/users.service';

@ApiTags('Wallet / Credit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('emitter/wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly usersService: UsersService,
  ) {}

  private async getAuthenticatedWallet(
    request: AuthenticatedRequest,
  ): Promise<string> {
    const user = await this.usersService.findById(request.user.userId);
    if (!user?.walletAddress) {
      throw new BadRequestException(
        'Akun belum memiliki alamat wallet yang terdaftar.',
      );
    }
    return user.walletAddress;
  }

  @ApiOperation({ summary: 'Create a wallet-link signature challenge' })
  @ApiResponse({ status: 201, description: 'Challenge created' })
  @Post('link/challenge')
  async createWalletLinkChallenge(
    @Body() dto: CreateWalletLinkChallengeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const challenge = await this.walletService.createWalletLinkChallenge(
      req.user.userId,
      dto.walletAddress,
    );
    return {
      success: true,
      data: challenge,
    };
  }

  @ApiOperation({ summary: 'Link a wallet after signature verification' })
  @ApiResponse({ status: 200, description: 'Wallet linked' })
  @Post('link')
  async linkWallet(
    @Body() dto: LinkWalletDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.walletService.linkWallet(
      req.user.userId,
      dto.challengeId,
      dto.walletAddress,
      dto.signature,
    );
    return {
      success: true,
      data: result,
    };
  }

  @ApiOperation({ summary: 'Create Xendit deposit invoice to top-up wallet' })
  @ApiResponse({ status: 201, description: 'Invoice URL created' })
  @Post('deposit')
  async createDeposit(
    @Body() dto: CreateDepositDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userAddress = await this.getAuthenticatedWallet(req);
    const result = await this.walletService.createDeposit(
      req.user.userId,
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
    const userAddress = await this.getAuthenticatedWallet(req);
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
    const userAddress = await this.getAuthenticatedWallet(req);
    const history = await this.walletService.getHistory(userAddress);
    return {
      success: true,
      data: history,
    };
  }
}
