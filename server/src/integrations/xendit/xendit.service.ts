import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Xendit } from 'xendit-node';
import type { Invoice } from 'xendit-node/invoice/models';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private xenditClient: Xendit;

  constructor() {
    const secretKey = process.env.XENDIT_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn('XENDIT_SECRET_KEY is not defined. Payments will fail.');
      // Initialize with dummy key starting with xnd_ to satisfy SDK format validation in test mode
      this.xenditClient = new Xendit({
        secretKey: 'xnd_development_dummy_key',
      });
    } else {
      this.xenditClient = new Xendit({ secretKey });
      this.logger.log('✅ Xendit API Client initialized in Test Mode');
    }
  }

  async createInvoice(
    externalId: string,
    amount: number,
    description: string,
  ): Promise<Pick<Invoice, 'invoiceUrl' | 'externalId' | 'status'>> {
    if (
      process.env.XENDIT_SECRET_KEY === 'xnd_development_xxxxxxx' ||
      !process.env.XENDIT_SECRET_KEY
    ) {
      this.logger.log(
        'Returning MOCK invoice because Xendit key is not configured.',
      );
      return {
        invoiceUrl: 'https://checkout-staging.xendit.co/web/mock-invoice',
        externalId,
        status: 'PENDING',
      };
    }

    try {
      const response = await this.xenditClient.Invoice.createInvoice({
        data: {
          externalId,
          amount,
          currency: 'IDR',
          description,
        },
      });
      return response;
    } catch (error) {
      this.logger.error('Failed to create Xendit invoice:', error);
      throw new InternalServerErrorException('Payment gateway error');
    }
  }

  verifyWebhook(callbackToken: string | undefined): boolean {
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!expectedToken) {
      const allowUnsignedDevelopmentWebhook =
        process.env.NODE_ENV !== 'production' &&
        process.env.ALLOW_UNSIGNED_XENDIT_WEBHOOK === 'true';

      if (allowUnsignedDevelopmentWebhook) {
        this.logger.warn(
          'Unsigned Xendit webhook validation is explicitly enabled for development.',
        );
        return true;
      }

      this.logger.error(
        'XENDIT_WEBHOOK_TOKEN is not configured; rejecting callback.',
      );
      return false;
    }
    return callbackToken === expectedToken;
  }
}
