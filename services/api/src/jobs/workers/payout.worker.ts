import { Worker, Job as BullJob } from 'bullmq';
import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';
import { query, getClient } from '../../db/pool.js';
import { selcomClient } from '../../integrations/selcom/selcom.client.js';
import { enqueueNotification } from '../queue.js';
import type { PayoutRequest, FundiWallet } from '@fundi-wangu/shared-types';

interface PayoutJobData {
  payoutId: string;
  fundiId: string;
  amountTzs: number;
  payoutNetwork: string;
  payoutNumber: string;
}

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379', 10),
};

/**
 * Payout processing worker.
 * Handles B2C mobile money transfers from platform to Fundi via Selcom Wallet Cashin.
 *
 * Uses the CASHIN utilitycode which auto-routes to the correct mobile network
 * (Vodacom M-Pesa, Tigo Pesa, Airtel Money, Halotel, TTCL) based on MNP lookup.
 *
 * Flow: lock payout row → mark processing → Selcom Cashin → update status
 */
export const payoutWorker = new Worker<PayoutJobData>(
  'payouts',
  async (job: BullJob<PayoutJobData>) => {
    const { payoutId, fundiId, amountTzs, payoutNetwork, payoutNumber } = job.data;

    logger.info({ event: 'payout.worker.processing', payoutId, fundiId, amountTzs });

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Lock the payout request row
      const payoutResult = await client.query<PayoutRequest>(
        `SELECT * FROM payout_requests WHERE id = $1 AND status = 'pending' FOR UPDATE`,
        [payoutId],
      );

      if (!payoutResult.rows[0]) {
        logger.info({ event: 'payout.worker.already_processed', payoutId });
        await client.query('ROLLBACK');
        return;
      }

      // Update status to processing
      await client.query(
        `UPDATE payout_requests SET status = 'processing' WHERE id = $1`,
        [payoutId],
      );

      await client.query('COMMIT');

      // Format phone for Selcom (255XXXXXXXXX)
      const msisdn = formatPayoutMsisdn(payoutNumber);
      const transId = `FW-PO-${payoutId.slice(0, 8)}-${Date.now()}`;

      // Initiate B2C transfer via Selcom Wallet Cashin
      const cashinResult = await selcomClient.initiateWalletCashin({
        transId,
        amount: amountTzs,
        receiverPhone: msisdn,
      });

      if (cashinResult.resultcode !== '000') {
        throw new Error(`Selcom Cashin failed: ${cashinResult.message}`);
      }

      const gatewayRef = cashinResult.data?.[0]?.reference ?? transId;

      // Update payout with gateway reference and mark as completed
      await query(
        `UPDATE payout_requests
         SET status = 'completed',
             gateway_reference = $1,
             processed_at = NOW()
         WHERE id = $2`,
        [String(gatewayRef), payoutId],
      );

      // Notify Fundi of successful payout
      await enqueueNotification({
        userId: fundiId,
        templateKey: 'PAYOUT_COMPLETED',
        variables: {
          amount: String(amountTzs),
          network: payoutNetwork,
        },
        channels: ['push', 'sms'],
        priority: 'high',
      });

      logger.info({
        event: 'payout.worker.completed',
        payoutId,
        fundiId,
        amountTzs,
        gatewayRef,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});

      // Mark payout as failed and restore wallet balance
      const failureReason = err instanceof Error ? err.message : 'Unknown error';

      await query(
        `UPDATE payout_requests SET status = 'failed', failure_reason = $1 WHERE id = $2`,
        [failureReason, payoutId],
      );

      // Restore the deducted balance back to the wallet
      await query(
        `UPDATE fundi_wallets
         SET balance_tzs = balance_tzs + $1, pending_tzs = pending_tzs - $1
         WHERE fundi_id = $2`,
        [amountTzs, fundiId],
      );

      // Notify Fundi of failed payout
      await enqueueNotification({
        userId: fundiId,
        templateKey: 'PAYOUT_FAILED',
        variables: { amount: String(amountTzs) },
        channels: ['push', 'sms'],
        priority: 'high',
      });

      logger.error({
        event: 'payout.worker.failed',
        payoutId,
        fundiId,
        error: failureReason,
      });

      throw err; // Re-throw for BullMQ retry
    } finally {
      client.release();
    }
  },
  {
    connection,
    concurrency: 3, // Limit concurrent payouts for safety
  },
);

/** Format phone number to Selcom MSISDN format (255XXXXXXXXX). */
function formatPayoutMsisdn(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('255') && cleaned.length === 12) return cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `255${cleaned.slice(1)}`;
  if (cleaned.length === 9) return `255${cleaned}`;
  return cleaned;
}

payoutWorker.on('failed', (job, err) => {
  logger.error({
    event: 'payout.worker.job_failed',
    jobId: job?.id,
    data: job?.data,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

payoutWorker.on('error', (err) => {
  logger.error({ event: 'payout.worker.error', error: err.message });
});
