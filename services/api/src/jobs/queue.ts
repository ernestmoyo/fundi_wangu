import { Queue } from 'bullmq';
import { config } from '../config/index.js';

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379', 10),
};

/** Notification delivery queue (push + SMS) */
export const notificationQueue = new Queue('notifications', { connection });

/** Payment processing queue (webhook handling, escrow) */
export const paymentQueue = new Queue('payments', { connection });

/** Escrow auto-release queue (delayed jobs) */
export const escrowQueue = new Queue('escrow', { connection });

/** Fundi payout processing queue */
export const payoutQueue = new Queue('payouts', { connection });

/** Helper: enqueue a notification for async delivery */
export async function enqueueNotification(data: {
  userId: string;
  templateKey: string;
  variables: Record<string, string>;
  channels: ('push' | 'sms')[];
  priority: 'high' | 'normal';
}): Promise<void> {
  await notificationQueue.add('send', data, {
    priority: data.priority === 'high' ? 1 : 5,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });
}

/** Helper: schedule escrow release */
export async function scheduleEscrowRelease(data: {
  jobId: string;
  releaseAt: Date;
}): Promise<void> {
  const delay = data.releaseAt.getTime() - Date.now();
  await escrowQueue.add('release', data, {
    delay: Math.max(delay, 0),
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}
