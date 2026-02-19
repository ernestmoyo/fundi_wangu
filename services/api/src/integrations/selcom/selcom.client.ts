import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';

export interface SelcomC2BParams {
  orderId: string;
  amount: number;
  buyerPhone: string;
  buyerName: string;
}

export interface SelcomB2CParams {
  orderId: string;
  amount: number;
  receiverPhone: string;
  receiverName: string;
}

export interface SelcomResponse {
  success: boolean;
  reference: string;
  message: string;
}

/**
 * Selcom Paytech API client.
 * All mobile money interactions (C2B payments, B2C payouts) go through this client.
 * Every call is logged for audit compliance.
 */
class SelcomClient {
  private isConfigured(): boolean {
    return !!(config.SELCOM_API_KEY && config.SELCOM_API_SECRET && config.SELCOM_VENDOR_ID);
  }

  /** Initiate Customer-to-Business payment (USSD push to customer phone) */
  async initiateC2B(params: SelcomC2BParams): Promise<SelcomResponse> {
    if (!this.isConfigured()) {
      logger.warn({ event: 'selcom.c2b.not_configured', orderId: params.orderId });
      // In development, simulate success
      if (config.NODE_ENV === 'development') {
        return {
          success: true,
          reference: `DEV-${params.orderId}`,
          message: 'Development mode: payment simulated',
        };
      }
      throw new Error('Selcom payment gateway not configured');
    }

    logger.info({
      event: 'selcom.c2b.initiated',
      orderId: params.orderId,
      amount: params.amount,
    });

    // Production implementation connects to Selcom API
    // See: https://dev.selcommobile.com
    throw new Error('Selcom production integration pending');
  }

  /** Check transaction status */
  async checkTransactionStatus(orderRef: string): Promise<SelcomResponse> {
    if (!this.isConfigured()) {
      return { success: true, reference: orderRef, message: 'Development mode' };
    }

    logger.info({ event: 'selcom.status_check', orderRef });
    throw new Error('Selcom production integration pending');
  }

  /** Initiate Business-to-Customer payout (Fundi withdrawal) */
  async initiateB2C(params: SelcomB2CParams): Promise<SelcomResponse> {
    if (!this.isConfigured()) {
      logger.warn({ event: 'selcom.b2c.not_configured', orderId: params.orderId });
      if (config.NODE_ENV === 'development') {
        return {
          success: true,
          reference: `DEV-PAYOUT-${params.orderId}`,
          message: 'Development mode: payout simulated',
        };
      }
      throw new Error('Selcom payment gateway not configured');
    }

    logger.info({
      event: 'selcom.b2c.initiated',
      orderId: params.orderId,
      amount: params.amount,
    });

    throw new Error('Selcom production integration pending');
  }

  /** Verify webhook HMAC signature from Selcom */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!config.SELCOM_WEBHOOK_SECRET) {
      logger.warn('Selcom webhook secret not configured');
      return config.NODE_ENV === 'development';
    }

    const expected = require('crypto')
      .createHmac('sha256', config.SELCOM_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return expected === signature;
  }
}

export const selcomClient = new SelcomClient();
