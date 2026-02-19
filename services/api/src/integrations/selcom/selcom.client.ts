import { createHmac } from 'node:crypto';
import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';

// ── Types ──────────────────────────────────────────

export interface SelcomCheckoutParams {
  orderId: string;
  amount: number;
  buyerPhone: string;
  buyerName: string;
  buyerEmail?: string;
  webhookUrl: string;
  remarks?: string;
}

export interface SelcomWalletPaymentParams {
  orderId: string;
  transId: string;
  msisdn: string;
}

export interface SelcomCashinParams {
  transId: string;
  amount: number;
  receiverPhone: string;
}

export interface SelcomOrderStatusResult {
  order_id: string;
  transid?: string;
  reference?: string;
  result: string;
  resultcode: string;
  payment_status: string;
  amount: number;
  msisdn?: string;
}

export interface SelcomApiResponse<T = Record<string, unknown>> {
  result: string;
  resultcode: string;
  message: string;
  data?: T[];
}

// ── Client ─────────────────────────────────────────

/**
 * Selcom Paytech API client for Tanzania mobile money payments.
 *
 * Implements:
 * - Checkout API (C2B): create-order → wallet-payment → status check
 * - Wallet Cashin (B2C): direct payout to mobile wallets via CASHIN utilitycode
 *
 * Authentication uses HMAC-SHA256 digest with timestamp-based signing.
 * All requests are logged for audit compliance.
 */
class SelcomClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.SELCOM_BASE_URL.replace(/\/$/, '');
  }

  // ── Authentication ─────────────────────────────

  /**
   * Generate Selcom API authentication headers.
   * Uses HMAC-SHA256 digest of the current timestamp signed with the API secret.
   */
  private getAuthHeaders(): Record<string, string> {
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
    const digest = createHmac('sha256', config.SELCOM_API_SECRET)
      .update(timestamp)
      .digest('base64');

    const authorization = Buffer.from(config.SELCOM_API_KEY).toString('base64');

    return {
      'Authorization': `SELCOM ${authorization}`,
      'Digest-Method': 'HS256',
      'Digest': digest,
      'Timestamp': timestamp,
      'Signed-Fields': 'timestamp',
      'Content-Type': 'application/json',
    };
  }

  private isConfigured(): boolean {
    return !!(
      config.SELCOM_API_KEY &&
      config.SELCOM_API_SECRET &&
      config.SELCOM_VENDOR_ID
    );
  }

  // ── HTTP ───────────────────────────────────────

  private async request<T = Record<string, unknown>>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<SelcomApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers = this.getAuthHeaders();

    logger.info({
      event: 'selcom.request',
      method,
      path,
      orderId: body?.order_id ?? body?.transid,
    });

    const fetchOptions: RequestInit = { method, headers };
    if (method === 'POST' && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const data = (await response.json()) as SelcomApiResponse<T>;

    if (!response.ok || data.resultcode !== '000') {
      logger.error({
        event: 'selcom.request.error',
        path,
        status: response.status,
        resultcode: data.resultcode,
        message: data.message,
      });
    } else {
      logger.info({
        event: 'selcom.request.success',
        path,
        resultcode: data.resultcode,
      });
    }

    return data;
  }

  // ── Checkout API (C2B — Customer Payment) ──────

  /**
   * Step 1: Create a checkout order.
   * This registers the payment intent with Selcom before triggering the USSD push.
   */
  async createCheckoutOrder(params: SelcomCheckoutParams): Promise<SelcomApiResponse> {
    if (!this.isConfigured()) {
      return this.simulateOrThrow('selcom.checkout.create', params.orderId);
    }

    return this.request('POST', '/checkout/create-order-minimal', {
      vendor: config.SELCOM_VENDOR_ID,
      order_id: params.orderId,
      buyer_email: params.buyerEmail ?? 'customer@fundiwangu.co.tz',
      buyer_name: params.buyerName,
      buyer_phone: params.buyerPhone,
      amount: params.amount,
      currency: 'TZS',
      webhook: params.webhookUrl,
      buyer_remarks: params.remarks ?? 'Fundi Wangu Payment',
      merchant_remarks: `Job Payment ${params.orderId}`,
      no_of_items: 1,
    });
  }

  /**
   * Step 2: Trigger USSD push payment to the customer's phone.
   * Must be called after createCheckoutOrder succeeds.
   */
  async processWalletPayment(params: SelcomWalletPaymentParams): Promise<SelcomApiResponse> {
    if (!this.isConfigured()) {
      return this.simulateOrThrow('selcom.wallet_payment', params.orderId);
    }

    return this.request('POST', '/checkout/wallet-payment', {
      order_id: params.orderId,
      transid: params.transId,
      msisdn: params.msisdn,
    });
  }

  /**
   * Check the status of a checkout order.
   */
  async getOrderStatus(orderId: string): Promise<SelcomApiResponse<SelcomOrderStatusResult>> {
    if (!this.isConfigured()) {
      return this.simulateOrThrow('selcom.order_status', orderId);
    }

    return this.request<SelcomOrderStatusResult>(
      'GET',
      `/checkout/order-status?order_id=${encodeURIComponent(orderId)}`,
    );
  }

  /**
   * Cancel a pending checkout order.
   */
  async cancelOrder(orderId: string): Promise<SelcomApiResponse> {
    if (!this.isConfigured()) {
      return this.simulateOrThrow('selcom.cancel_order', orderId);
    }

    return this.request('POST', `/checkout/cancel-order`, {
      order_id: orderId,
    });
  }

  // ── Wallet Cashin (B2C — Fundi Payout) ─────────

  /**
   * Send money to a mobile wallet (B2C payout).
   * Uses CASHIN utilitycode which auto-routes based on mobile network.
   * Supports: Vodacom M-Pesa, Tigo Pesa, Airtel Money, Halotel, TTCL.
   */
  async initiateWalletCashin(params: SelcomCashinParams): Promise<SelcomApiResponse> {
    if (!this.isConfigured()) {
      return this.simulateOrThrow('selcom.cashin', params.transId);
    }

    return this.request('POST', '/utilitypayment/process-payment', {
      vendor: config.SELCOM_VENDOR_ID,
      utilitycode: 'CASHIN',
      utilityref: params.receiverPhone,
      amount: params.amount,
      transid: params.transId,
      pin: config.SELCOM_API_SECRET,
    });
  }

  // ── Webhook Signature Verification ─────────────

  /**
   * Verify HMAC signature on incoming Selcom webhooks.
   * Selcom signs the raw request body with the shared webhook secret.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!config.SELCOM_WEBHOOK_SECRET) {
      logger.warn('Selcom webhook secret not configured');
      return config.NODE_ENV === 'development';
    }

    const expected = createHmac('sha256', config.SELCOM_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // Timing-safe comparison
    if (expected.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
      mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
  }

  // ── Helpers ────────────────────────────────────

  /**
   * In development mode, simulate a successful response.
   * In production, throw if Selcom is not configured.
   */
  private simulateOrThrow(event: string, refId: string): SelcomApiResponse {
    logger.warn({ event: `${event}.not_configured`, refId });

    if (config.NODE_ENV === 'development') {
      return {
        result: 'SUCCESS',
        resultcode: '000',
        message: 'Development mode: simulated',
        data: [{ reference: `DEV-${refId}` }] as Record<string, unknown>[],
      };
    }

    throw new Error('Selcom payment gateway not configured');
  }
}

export const selcomClient = new SelcomClient();
