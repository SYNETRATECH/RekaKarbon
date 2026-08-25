import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
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
      // Initialize with dummy key to prevent crash, but operations will fail
      this.xenditClient = new Xendit({ secretKey: 'dummy' });
    } else {
      this.xenditClient = new Xendit({ secretKey });
      this.logger.log('✅ Xendit API Client initialized in Test Mode');
    }
  }

  async createInvoice(externalId: string, amount: number, description: string) {
    if (process.env.XENDIT_SECRET_KEY === 'xnd_development_xxxxxxx' || !process.env.XENDIT_SECRET_KEY) {
      this.logger.log('Returning MOCK invoice because Xendit key is not configured.');
      return {
        invoiceUrl: 'https://checkout-staging.xendit.co/web/mock-invoice',
        externalId: externalId,
        status: 'PENDING'
      } as any;
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
      this.logger.warn('XENDIT_WEBHOOK_TOKEN not configured, skipping validation');
      return true; // Bypass in dev if not set
    }
    return callbackToken === expectedToken;
  }
}
