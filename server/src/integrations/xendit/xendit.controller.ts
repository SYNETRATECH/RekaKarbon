import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { XenditService } from './xendit.service';
import { WalletService } from '../../wallet/wallet.service';
type XenditInvoiceCallbackPayload = {
  external_id: string;
  status: string;
  id?: string;
  invoice_id?: string;
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
        await this.walletService.processDeposit(
          payload.external_id,
          payload.id ?? payload.invoice_id,
        );
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
        if (error instanceof Error) {
          throw error;
        }
        throw new InternalServerErrorException(
          'Deposit processing failed; please retry the callback',
        );
      }
    }

    return { success: true, message: 'Ignored status' };
  }
}
