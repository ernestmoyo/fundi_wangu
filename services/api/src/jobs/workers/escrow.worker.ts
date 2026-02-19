import { Worker, Job as BullJob } from 'bullmq';
import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';
import { paymentService } from '../../services/payment.service.js';

interface EscrowJobData {
  jobId: string;
  releaseAt: string;
}

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379', 10),
};

/**
 * Escrow release worker.
 * Processes delayed escrow release jobs — auto-releases funds to Fundi wallet
 * after the 24-hour hold period (unless disputed).
 */
export const escrowWorker = new Worker<EscrowJobData>(
  'escrow',
  async (job: BullJob<EscrowJobData>) => {
    const { jobId } = job.data;

    logger.info({ event: 'escrow.worker.processing', jobId });

    try {
      await paymentService.releaseEscrow(jobId);
      logger.info({ event: 'escrow.worker.released', jobId });
    } catch (err) {
      logger.error({
        event: 'escrow.worker.release_failed',
        jobId,
        error: err instanceof Error ? err.message : err,
      });
      throw err; // Re-throw for BullMQ retry
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

escrowWorker.on('failed', (job, err) => {
  logger.error({
    event: 'escrow.worker.job_failed',
    jobId: job?.id,
    data: job?.data,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

escrowWorker.on('error', (err) => {
  logger.error({ event: 'escrow.worker.error', error: err.message });
});
