import { query, getClient } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { enqueueNotification } from '../jobs/queue.js';
import type { Dispute, Job } from '@fundi-wangu/shared-types';

class DisputeService {
  // ──────────────────────────────────────────────
  // Raise a dispute
  // ──────────────────────────────────────────────

  /**
   * Raise a dispute on a completed or in-progress job.
   * Freezes escrow by nullifying escrow_release_at and transitions job status to 'disputed'.
   * Either customer or fundi can raise.
   */
  async raiseDispute(
    userId: string,
    userRole: string,
    data: { job_id: string; statement: string; evidence?: string[] },
  ): Promise<Dispute> {
    // Verify the job exists and the user is a party
    const jobResult = await query<Job>(
      `SELECT * FROM jobs WHERE id = $1 AND (customer_id = $2 OR fundi_id = $2)`,
      [data.job_id, userId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'Job not found or you are not a party to this job.',
        'Kazi haipatikani au si mhusika wa kazi hii.',
        'JOB_NOT_FOUND',
      );
    }

    // Disputes allowed only on completed or in_progress jobs
    if (job.status !== 'completed' && job.status !== 'in_progress') {
      throw new AppError(
        400,
        'Disputes can only be raised for completed or in-progress jobs.',
        'Malalamiko yanaweza kufunguliwa tu kwa kazi zilizokamilika au zinazoendelea.',
        'INVALID_DISPUTE_STATE',
      );
    }

    // Check for existing dispute
    const existingDispute = await query<Dispute>(
      'SELECT id FROM disputes WHERE job_id = $1',
      [data.job_id],
    );

    if (existingDispute.rows.length > 0) {
      throw new AppError(
        409,
        'A dispute already exists for this job.',
        'Malalamiko tayari yamefunguliwa kwa kazi hii.',
        'DUPLICATE_DISPUTE',
      );
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Determine statement field based on role
      const isCustomer = job.customer_id === userId;
      const customerStatement = isCustomer ? data.statement : null;
      const fundiStatement = isCustomer ? null : data.statement;
      const customerEvidence = isCustomer ? (data.evidence ?? []) : [];
      const fundiEvidence = isCustomer ? [] : (data.evidence ?? []);

      // Create the dispute
      const disputeResult = await client.query<Dispute>(
        `INSERT INTO disputes (
          job_id, raised_by_id, status,
          customer_statement, fundi_statement,
          customer_evidence, fundi_evidence
        ) VALUES ($1, $2, 'open', $3, $4, $5, $6)
        RETURNING *`,
        [
          data.job_id,
          userId,
          customerStatement,
          fundiStatement,
          customerEvidence,
          fundiEvidence,
        ],
      );

      // Transition job status to 'disputed' and freeze escrow
      await client.query(
        `UPDATE jobs
         SET status = 'disputed',
             disputed_at = NOW(),
             escrow_release_at = NULL
         WHERE id = $1`,
        [data.job_id],
      );

      await client.query('COMMIT');

      const dispute = disputeResult.rows[0]!;

      // Notify the other party
      const otherPartyId = isCustomer ? job.fundi_id : job.customer_id;
      if (otherPartyId) {
        await enqueueNotification({
          userId: otherPartyId,
          templateKey: 'DISPUTE_OPENED',
          variables: { jobRef: job.job_reference },
          channels: ['push', 'sms'],
          priority: 'high',
        });
      }

      logger.info({
        event: 'dispute.raised',
        disputeId: dispute.id,
        jobId: data.job_id,
        raisedBy: userId,
        role: userRole,
      });

      return dispute;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────
  // Submit evidence
  // ──────────────────────────────────────────────

  /** Add evidence or a statement to an existing dispute */
  async submitEvidence(
    userId: string,
    disputeId: string,
    data: { statement?: string; evidence?: string[] },
  ): Promise<Dispute> {
    const disputeResult = await query<Dispute>(
      'SELECT * FROM disputes WHERE id = $1',
      [disputeId],
    );
    const dispute = disputeResult.rows[0];

    if (!dispute) {
      throw new AppError(404, 'Dispute not found.', 'Malalamiko hayapatikani.', 'DISPUTE_NOT_FOUND');
    }

    if (dispute.status !== 'open' && dispute.status !== 'under_review') {
      throw new AppError(
        400,
        'This dispute is already resolved.',
        'Malalamiko haya tayari yametatuliwa.',
        'DISPUTE_RESOLVED',
      );
    }

    // Determine if the user is the customer or fundi
    const jobResult = await query<Job>(
      'SELECT customer_id, fundi_id FROM jobs WHERE id = $1',
      [dispute.job_id],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(404, 'Job not found.', 'Kazi haipatikani.', 'JOB_NOT_FOUND');
    }

    const isCustomer = job.customer_id === userId;
    const isFundi = job.fundi_id === userId;

    if (!isCustomer && !isFundi) {
      throw new AppError(
        403,
        'You are not a party to this dispute.',
        'Wewe si mhusika wa malalamiko haya.',
        'NOT_PARTY_TO_DISPUTE',
      );
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (isCustomer) {
      if (data.statement) {
        updates.push(`customer_statement = $${idx}`);
        values.push(data.statement);
        idx++;
      }
      if (data.evidence) {
        updates.push(`customer_evidence = customer_evidence || $${idx}::text[]`);
        values.push(data.evidence);
        idx++;
      }
    } else {
      if (data.statement) {
        updates.push(`fundi_statement = $${idx}`);
        values.push(data.statement);
        idx++;
      }
      if (data.evidence) {
        updates.push(`fundi_evidence = fundi_evidence || $${idx}::text[]`);
        values.push(data.evidence);
        idx++;
      }
    }

    if (updates.length === 0) {
      throw new AppError(
        400,
        'No evidence or statement provided.',
        'Hakuna ushahidi au taarifa iliyotolewa.',
        'NO_EVIDENCE',
      );
    }

    values.push(disputeId);
    const result = await query<Dispute>(
      `UPDATE disputes SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    logger.info({
      event: 'dispute.evidence_submitted',
      disputeId,
      submittedBy: userId,
      role: isCustomer ? 'customer' : 'fundi',
    });

    return result.rows[0]!;
  }

  // ──────────────────────────────────────────────
  // Dispute queries
  // ──────────────────────────────────────────────

  /** Get dispute details */
  async getDispute(disputeId: string, userId: string): Promise<Dispute> {
    const result = await query<Dispute>(
      `SELECT d.* FROM disputes d
       JOIN jobs j ON j.id = d.job_id
       WHERE d.id = $1 AND (j.customer_id = $2 OR j.fundi_id = $2)`,
      [disputeId, userId],
    );

    if (!result.rows[0]) {
      throw new AppError(
        404,
        'Dispute not found.',
        'Malalamiko hayapatikani.',
        'DISPUTE_NOT_FOUND',
      );
    }

    return result.rows[0];
  }

  /** Get dispute for a job */
  async getDisputeByJob(jobId: string, userId: string): Promise<Dispute | null> {
    const result = await query<Dispute>(
      `SELECT d.* FROM disputes d
       JOIN jobs j ON j.id = d.job_id
       WHERE d.job_id = $1 AND (j.customer_id = $2 OR j.fundi_id = $2)`,
      [jobId, userId],
    );

    return result.rows[0] ?? null;
  }

  /** List user's disputes */
  async listDisputes(userId: string, page: number = 1, perPage: number = 20) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM disputes d
         JOIN jobs j ON j.id = d.job_id
         WHERE j.customer_id = $1 OR j.fundi_id = $1`,
        [userId],
      ),
      query<Dispute>(
        `SELECT d.* FROM disputes d
         JOIN jobs j ON j.id = d.job_id
         WHERE j.customer_id = $1 OR j.fundi_id = $1
         ORDER BY d.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, perPage, offset],
      ),
    ]);

    return {
      success: true,
      data: dataResult.rows,
      meta: {
        page,
        per_page: perPage,
        total: parseInt(countResult.rows[0]?.count ?? '0', 10),
      },
      error: null,
    };
  }
}

export const disputeService = new DisputeService();
