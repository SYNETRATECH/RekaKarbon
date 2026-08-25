import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { XenditService } from './xendit.service';
import { WalletService } from '../../wallet/wallet.service';
import type { InvoiceCallback } from 'xendit-node/invoice/models';

type XenditInvoiceCallbackPayload = Pick<InvoiceCallback, 'status'> & {
  external_id: string;
};

@ApiTags('Webhooks')
@Controller('webhook/xendit')
export class XenditController {
  private readonly logger = new Logger(XenditController.name);

  constructor(
    private readonly xenditService: XenditService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
  ) {}

  @ApiOperation({ summary: 'Xendit Invoice Callback' })
  @Post()
  async handleCallback(
    @Headers('x-callback-token') token: string | undefined,
    @Body() payload: XenditInvoiceCallbackPayload,
  ) {
    if (!this.xenditService.verifyWebhook(token)) {
      throw new UnauthorizedException('Invalid Xendit callback token');
    }

    this.logger.log(
      `Received Xendit webhook for invoice ${payload.external_id} with status ${payload.status}`,
    );

    if (payload.status === 'PAID' || payload.status === 'SETTLED') {
      try {
        await this.walletService.processDeposit(payload.external_id);
        return { success: true, message: 'Deposit processed' };
      } catch (error) {
        const errorDetails =
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error);
        this.logger.error(
          `Failed to process deposit for ${payload.external_id}`,
          errorDetails,
        );
        // Do not throw 500 so Xendit stops retrying if it's our DB error, or maybe throw 500 so it retries.
        // Let's return 200 to acknowledge receipt.
        return {
          success: false,
          message: 'Failed to mint token, please contact support',
        };
      }
    }

    return { success: true, message: 'Ignored status' };
  }
}
