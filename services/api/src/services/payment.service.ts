import { query, getClient } from '../db/pool.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { selcomClient } from '../integrations/selcom/selcom.client.js';
import { enqueueNotification } from '../jobs/queue.js';
import { calculateFees } from '@fundi-wangu/utils';
import { PLATFORM_DEFAULTS } from '@fundi-wangu/shared-types';
import type { Job, PaymentTransaction, FundiWallet } from '@fundi-wangu/shared-types';

class PaymentService {
  // ──────────────────────────────────────────────
  // Payment initiation (C2B — customer to escrow)
  // ──────────────────────────────────────────────

  /**
   * Initiate a mobile money payment for a job.
   *
   * Two-step Selcom Checkout flow:
   *   1. Create a checkout order (registers the payment intent)
   *   2. Trigger USSD push to customer's phone (wallet-payment)
   *
   * The customer confirms on their phone, then Selcom sends a webhook callback.
   */
  async initiatePayment(
    userId: string,
    jobId: string,
    paymentMethod: string,
    phoneNumber: string,
  ): Promise<PaymentTransaction> {
    // Validate the job belongs to this customer
    const jobResult = await query<Job>(
      'SELECT * FROM jobs WHERE id = $1 AND customer_id = $2',
      [jobId, userId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'Job not found or not your job.',
        'Kazi haipatikani au si yako.',
        'JOB_NOT_FOUND',
      );
    }

    if (job.status !== 'accepted' && job.status !== 'in_progress') {
      throw new AppError(
        400,
        'Payment can only be initiated for accepted or in-progress jobs.',
        'Malipo yanaweza kuanzishwa tu kwa kazi zilizokubaliwa au zinazoendelea.',
        'INVALID_PAYMENT_STATE',
      );
    }

    // Idempotency: check if a payment already exists for this job
    const existingPayment = await query<PaymentTransaction>(
      `SELECT * FROM payment_transactions
       WHERE job_id = $1 AND direction = 'customer_to_escrow'
       AND status IN ('initiated', 'processing', 'held_escrow')`,
      [jobId],
    );

    if (existingPayment.rows.length > 0) {
      const existing = existingPayment.rows[0]!;
      if (existing.status === 'held_escrow') {
        throw new AppError(
          409,
          'Payment already completed for this job.',
          'Malipo tayari yamekamilika kwa kazi hii.',
          'PAYMENT_ALREADY_COMPLETED',
        );
      }
      return existing;
    }

    const idempotencyKey = `c2b-${jobId}-${Date.now()}`;
    const amount = job.quoted_amount_tzs;
    const fees = calculateFees(
      amount,
      PLATFORM_DEFAULTS.platformFeePercent,
      PLATFORM_DEFAULTS.vatPercent,
    );

    // Create the payment transaction record
    const txResult = await query<PaymentTransaction>(
      `INSERT INTO payment_transactions (
        job_id, idempotency_key, amount_tzs, platform_fee_tzs, vat_tzs, net_tzs,
        payment_method, direction, status, phone_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer_to_escrow', 'initiated', $8)
      RETURNING *`,
      [
        jobId,
        idempotencyKey,
        fees.grossAmountTzs,
        fees.platformFeeTzs,
        fees.vatTzs,
        fees.netToFundiTzs,
        paymentMethod,
        phoneNumber,
      ],
    );

    const transaction = txResult.rows[0]!;

    // Format phone number for Selcom (must start with 255)
    const msisdn = this.formatMsisdn(phoneNumber);
    const webhookUrl = `${config.API_BASE_URL}/api/v1/webhooks/selcom`;

    try {
      // Step 1: Create checkout order with Selcom
      const createResult = await selcomClient.createCheckoutOrder({
        orderId: transaction.id,
        amount: fees.grossAmountTzs,
        buyerPhone: msisdn,
        buyerName: 'Fundi Wangu Customer',
        webhookUrl,
        remarks: `Job #${jobId.slice(0, 8)}`,
      });

      if (createResult.resultcode !== '000') {
        throw new Error(`Selcom order creation failed: ${createResult.message}`);
      }

      // Step 2: Trigger USSD push to customer phone
      const transId = `FW-${transaction.id.slice(0, 12)}-${Date.now()}`;
      const payResult = await selcomClient.processWalletPayment({
        orderId: transaction.id,
        transId,
        msisdn,
      });

      if (payResult.resultcode !== '000') {
        throw new Error(`Selcom USSD push failed: ${payResult.message}`);
      }

      // Extract gateway reference from response
      const gatewayRef = payResult.data?.[0]?.reference ?? transId;

      // Update transaction with gateway reference
      await query(
        `UPDATE payment_transactions
         SET gateway_reference = $1, gateway_name = 'selcom', status = 'processing'
         WHERE id = $2`,
        [String(gatewayRef), transaction.id],
      );

      logger.info({
        event: 'payment.initiated',
        transactionId: transaction.id,
        jobId,
        amount: fees.grossAmountTzs,
        method: paymentMethod,
        gatewayRef,
      });
    } catch (err) {
      // Mark as failed if gateway rejects immediately
      await query(
        `UPDATE payment_transactions SET status = 'failed', failure_reason = $1 WHERE id = $2`,
        [err instanceof Error ? err.message : 'Gateway error', transaction.id],
      );

      throw new AppError(
        502,
        'Payment gateway error. Please try again.',
        'Hitilafu ya malipo. Tafadhali jaribu tena.',
        'PAYMENT_GATEWAY_ERROR',
      );
    }

    return { ...transaction, status: 'processing' } as PaymentTransaction;
  }

  // ──────────────────────────────────────────────
  // Webhook processing (Selcom callback)
  // ──────────────────────────────────────────────

  /**
   * Process Selcom payment webhook.
   * Validates signature, updates transaction status, and triggers escrow hold.
   *
   * Selcom sends webhooks with checkout order result data including:
   * - order_id: our transaction ID
   * - resultcode: "000" for success
   * - payment_status: "COMPLETED", "FAILED", "PENDING"
   */
  async processSelcomWebhook(rawBody: string, signature: string, payload: {
    order_id: string;
    transid?: string;
    reference?: string;
    result: string;
    resultcode: string;
    payment_status: string;
    amount?: number;
    msisdn?: string;
    channel?: string;
  }): Promise<void> {
    // Verify webhook signature
    const isValid = selcomClient.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn({ event: 'webhook.invalid_signature', orderId: payload.order_id });
      throw new AppError(401, 'Invalid webhook signature.', 'Sahihi ya webhook si sahihi.', 'INVALID_SIGNATURE');
    }

    const txResult = await query<PaymentTransaction>(
      'SELECT * FROM payment_transactions WHERE id = $1',
      [payload.order_id],
    );
    const transaction = txResult.rows[0];

    if (!transaction) {
      logger.warn({ event: 'webhook.transaction_not_found', orderId: payload.order_id });
      return;
    }

    // Prevent duplicate processing
    if (transaction.status === 'held_escrow' || transaction.status === 'released') {
      logger.info({ event: 'webhook.already_processed', transactionId: transaction.id });
      return;
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const isSuccess = payload.resultcode === '000'
        || payload.payment_status === 'COMPLETED'
        || payload.result === 'SUCCESS';

      if (isSuccess) {
        // Payment successful — move to escrow
        await client.query(
          `UPDATE payment_transactions
           SET status = 'held_escrow',
               gateway_reference = COALESCE($1, gateway_reference),
               gateway_raw_response = $2
           WHERE id = $3`,
          [
            payload.reference ?? payload.transid ?? null,
            JSON.stringify(payload),
            transaction.id,
          ],
        );

        // Update job with payment confirmation
        await client.query(
          `UPDATE jobs SET payment_method = $1 WHERE id = $2`,
          [transaction.payment_method, transaction.job_id],
        );

        logger.info({
          event: 'payment.held_escrow',
          transactionId: transaction.id,
          jobId: transaction.job_id,
          amount: transaction.amount_tzs,
        });

        // Notify customer that payment was received
        const jobResult = await client.query<Job>(
          'SELECT * FROM jobs WHERE id = $1',
          [transaction.job_id],
        );
        const job = jobResult.rows[0];

        if (job) {
          await enqueueNotification({
            userId: job.customer_id,
            templateKey: 'PAYMENT_RECEIVED',
            variables: { amount: String(transaction.amount_tzs) },
            channels: ['push'],
            priority: 'normal',
          });
        }
      } else {
        // Payment failed
        await client.query(
          `UPDATE payment_transactions
           SET status = 'failed',
               failure_reason = $1,
               gateway_raw_response = $2,
               retry_count = retry_count + 1
           WHERE id = $3`,
          [
            payload.result ?? payload.payment_status ?? 'Unknown failure',
            JSON.stringify(payload),
            transaction.id,
          ],
        );

        logger.warn({
          event: 'payment.failed',
          transactionId: transaction.id,
          jobId: transaction.job_id,
          reason: payload.result,
          resultcode: payload.resultcode,
        });
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────
  // Escrow release
  // ──────────────────────────────────────────────

  /**
   * Release escrow funds to Fundi wallet.
   * Called by the escrow release worker after 24-hour hold (or manual release).
   */
  async releaseEscrow(jobId: string): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get the escrow transaction
      const txResult = await client.query<PaymentTransaction>(
        `SELECT * FROM payment_transactions
         WHERE job_id = $1 AND direction = 'customer_to_escrow' AND status = 'held_escrow'
         FOR UPDATE`,
        [jobId],
      );
      const transaction = txResult.rows[0];

      if (!transaction) {
        logger.warn({ event: 'escrow.no_held_transaction', jobId });
        await client.query('ROLLBACK');
        return;
      }

      // Get the job to find the Fundi
      const jobResult = await client.query<Job>(
        'SELECT * FROM jobs WHERE id = $1',
        [jobId],
      );
      const job = jobResult.rows[0];

      if (!job?.fundi_id) {
        logger.error({ event: 'escrow.no_fundi', jobId });
        await client.query('ROLLBACK');
        return;
      }

      // Check for active disputes — do not release if disputed
      if (job.status === 'disputed') {
        logger.info({ event: 'escrow.blocked_by_dispute', jobId });
        await client.query('ROLLBACK');
        return;
      }

      // Release the escrow transaction
      await client.query(
        `UPDATE payment_transactions SET status = 'released' WHERE id = $1`,
        [transaction.id],
      );

      // Credit Fundi wallet
      await client.query(
        `INSERT INTO fundi_wallets (fundi_id, balance_tzs, pending_tzs, total_earned_tzs)
         VALUES ($1, $2, 0, $2)
         ON CONFLICT (fundi_id)
         DO UPDATE SET
           balance_tzs = fundi_wallets.balance_tzs + $2,
           total_earned_tzs = fundi_wallets.total_earned_tzs + $2,
           updated_at = NOW()`,
        [job.fundi_id, transaction.net_tzs],
      );

      // Create platform fee record
      await client.query(
        `INSERT INTO payment_transactions (
          job_id, idempotency_key, amount_tzs, platform_fee_tzs, vat_tzs, net_tzs,
          payment_method, direction, status
        ) VALUES ($1, $2, $3, $3, $4, 0, $5, 'platform_fee', 'released')`,
        [
          jobId,
          `fee-${jobId}-${Date.now()}`,
          transaction.platform_fee_tzs,
          transaction.vat_tzs,
          transaction.payment_method,
        ],
      );

      await client.query('COMMIT');

      // Notify Fundi about payment
      await enqueueNotification({
        userId: job.fundi_id,
        templateKey: 'PAYMENT_RELEASED',
        variables: { amount: String(transaction.net_tzs) },
        channels: ['push', 'sms'],
        priority: 'high',
      });

      logger.info({
        event: 'escrow.released',
        jobId,
        transactionId: transaction.id,
        fundiId: job.fundi_id,
        netAmount: transaction.net_tzs,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────
  // Tips
  // ──────────────────────────────────────────────

  /**
   * Send a tip from customer to Fundi for a completed job.
   * Tips bypass the platform fee — 100% goes to Fundi.
   */
  async sendTip(
    customerId: string,
    jobId: string,
    amountTzs: number,
    paymentMethod: string,
    phoneNumber?: string,
  ): Promise<PaymentTransaction> {
    const jobResult = await query<Job>(
      `SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND status = 'completed'`,
      [jobId, customerId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'Completed job not found.',
        'Kazi iliyokamilika haipatikani.',
        'JOB_NOT_FOUND',
      );
    }

    if (!job.fundi_id) {
      throw new AppError(400, 'No fundi assigned.', 'Hakuna fundi.', 'NO_FUNDI');
    }

    if (amountTzs < 1000) {
      throw new AppError(400, 'Minimum tip is TZS 1,000.', 'Kima cha chini cha tuzo ni TZS 1,000.', 'MIN_TIP');
    }

    const idempotencyKey = `tip-${jobId}-${customerId}-${Date.now()}`;

    const txResult = await query<PaymentTransaction>(
      `INSERT INTO payment_transactions (
        job_id, idempotency_key, amount_tzs, platform_fee_tzs, vat_tzs, net_tzs,
        payment_method, direction, status, phone_number
      ) VALUES ($1, $2, $3, 0, 0, $3, $4, 'tip', 'held_escrow', $5)
      RETURNING *`,
      [jobId, idempotencyKey, amountTzs, paymentMethod, phoneNumber ?? null],
    );

    const transaction = txResult.rows[0]!;

    // Credit Fundi wallet immediately (tips don't go through escrow)
    await query(
      `INSERT INTO fundi_wallets (fundi_id, balance_tzs, pending_tzs, total_earned_tzs)
       VALUES ($1, $2, 0, $2)
       ON CONFLICT (fundi_id)
       DO UPDATE SET
         balance_tzs = fundi_wallets.balance_tzs + $2,
         total_earned_tzs = fundi_wallets.total_earned_tzs + $2,
         updated_at = NOW()`,
      [job.fundi_id, amountTzs],
    );

    // Mark as released
    await query(
      `UPDATE payment_transactions SET status = 'released' WHERE id = $1`,
      [transaction.id],
    );

    // Also record tip on the review if exists
    await query(
      `UPDATE reviews SET tip_tzs = tip_tzs + $1 WHERE job_id = $2 AND reviewer_id = $3`,
      [amountTzs, jobId, customerId],
    );

    logger.info({
      event: 'payment.tip_sent',
      jobId,
      fundiId: job.fundi_id,
      amount: amountTzs,
      transactionId: transaction.id,
    });

    return { ...transaction, status: 'released' } as PaymentTransaction;
  }

  // ──────────────────────────────────────────────
  // Payment queries
  // ──────────────────────────────────────────────

  /** Get payment details for a job */
  async getJobPayments(jobId: string, userId: string): Promise<PaymentTransaction[]> {
    const result = await query<PaymentTransaction>(
      `SELECT pt.* FROM payment_transactions pt
       JOIN jobs j ON j.id = pt.job_id
       WHERE pt.job_id = $1 AND (j.customer_id = $2 OR j.fundi_id = $2)
       ORDER BY pt.created_at ASC`,
      [jobId, userId],
    );

    return result.rows;
  }

  /** Get payment status */
  async getPaymentStatus(transactionId: string, userId: string): Promise<PaymentTransaction> {
    const result = await query<PaymentTransaction>(
      `SELECT pt.* FROM payment_transactions pt
       JOIN jobs j ON j.id = pt.job_id
       WHERE pt.id = $1 AND (j.customer_id = $2 OR j.fundi_id = $2)`,
      [transactionId, userId],
    );

    if (!result.rows[0]) {
      throw new AppError(
        404,
        'Transaction not found.',
        'Muamala haupatikani.',
        'TRANSACTION_NOT_FOUND',
      );
    }

    return result.rows[0];
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  /**
   * Format phone number to Selcom MSISDN format (255XXXXXXXXX).
   * Accepts: +255..., 0..., 255...
   */
  private formatMsisdn(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('255') && cleaned.length === 12) return cleaned;
    if (cleaned.startsWith('0') && cleaned.length === 10) return `255${cleaned.slice(1)}`;
    if (cleaned.length === 9) return `255${cleaned}`;
    return cleaned;
  }
}

export const paymentService = new PaymentService();
