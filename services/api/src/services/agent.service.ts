import { query } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { jobService } from './job.service.js';
import { enqueueNotification } from '../jobs/queue.js';
import type { Job, User } from '@fundi-wangu/shared-types';

/**
 * Agent/Dispatcher service.
 * Agents relay jobs for customers who are offline or using feature phones.
 * They create bookings on behalf of customers and manage assignments.
 */
class AgentService {
  /**
   * Create a job on behalf of a customer.
   * The agent's ID is recorded for tracking and commission purposes.
   */
  async createJobForCustomer(
    agentId: string,
    customerPhone: string,
    data: {
      category: string;
      service_items: { fundi_service_id: string; quantity: number }[];
      description_text: string;
      description_photos?: string[];
      latitude: number;
      longitude: number;
      address_text: string;
      address_district?: string;
      address_ward?: string;
      scheduled_at?: string;
      payment_method: string;
      is_womens_filter?: boolean;
    },
  ): Promise<Job> {
    // Find the customer by phone
    const customerResult = await query<User>(
      'SELECT id, name FROM users WHERE phone_number = $1 AND is_active = true',
      [customerPhone],
    );
    const customer = customerResult.rows[0];

    if (!customer) {
      throw new AppError(
        404,
        'Customer with this phone number not found.',
        'Mteja mwenye nambari hii haipatikani.',
        'CUSTOMER_NOT_FOUND',
      );
    }

    // Create the job using the existing job service
    const job = await jobService.createJob(customer.id, data);

    // Record the agent on the job
    await query(
      'UPDATE jobs SET agent_id = $1 WHERE id = $2',
      [agentId, job.id],
    );

    logger.info({
      event: 'agent.job_created',
      agentId,
      customerId: customer.id,
      customerPhone,
      jobId: job.id,
      jobReference: job.job_reference,
    });

    return { ...job, agent_id: agentId };
  }

  /** List jobs the agent has dispatched */
  async listAgentJobs(agentId: string, page: number = 1, perPage: number = 20) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM jobs WHERE agent_id = $1',
        [agentId],
      ),
      query<Job & { customer_name: string; fundi_name: string | null }>(
        `SELECT j.*, cu.name as customer_name, fu.name as fundi_name
         FROM jobs j
         JOIN users cu ON cu.id = j.customer_id
         LEFT JOIN users fu ON fu.id = j.fundi_id
         WHERE j.agent_id = $1
         ORDER BY j.created_at DESC
         LIMIT $2 OFFSET $3`,
        [agentId, perPage, offset],
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

  /** Assign a specific Fundi to a job (manual assignment by agent) */
  async assignFundi(agentId: string, jobId: string, fundiId: string): Promise<Job> {
    const jobResult = await query<Job>(
      'SELECT * FROM jobs WHERE id = $1 AND agent_id = $2 AND status = $3',
      [jobId, agentId, 'pending'],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'Pending job not found or not dispatched by you.',
        'Kazi inayosubiri haipatikani au si yako.',
        'JOB_NOT_FOUND',
      );
    }

    // Verify the Fundi exists and is eligible
    const fundiResult = await query<{ user_id: string; verification_tier: string }>(
      `SELECT fp.user_id, fp.verification_tier
       FROM fundi_profiles fp
       JOIN users u ON u.id = fp.user_id AND u.is_active = true
       WHERE fp.user_id = $1`,
      [fundiId],
    );

    if (!fundiResult.rows[0]) {
      throw new AppError(404, 'Fundi not found.', 'Fundi hapatikani.', 'FUNDI_NOT_FOUND');
    }

    if (!['tier2_id', 'tier3_certified'].includes(fundiResult.rows[0].verification_tier)) {
      throw new AppError(
        400,
        'Fundi is not verified (Tier 2+ required).',
        'Fundi hajathibitishwa (Ngazi ya 2+ inahitajika).',
        'FUNDI_NOT_VERIFIED',
      );
    }

    // Update the job
    const result = await query<Job>(
      `UPDATE jobs SET fundi_id = $1, status = 'accepted', accepted_at = NOW()
       WHERE id = $2 RETURNING *`,
      [fundiId, jobId],
    );

    // Notify both parties
    await enqueueNotification({
      userId: fundiId,
      templateKey: 'JOB_REQUEST',
      variables: {
        category: job.category,
        distance: '0',
        amount: String(job.quoted_amount_tzs),
        jobRef: job.job_reference,
      },
      channels: ['push', 'sms'],
      priority: 'high',
    });

    await enqueueNotification({
      userId: job.customer_id,
      templateKey: 'JOB_CONFIRMED',
      variables: { jobRef: job.job_reference, fundiName: 'Fundi' },
      channels: ['push'],
      priority: 'high',
    });

    logger.info({
      event: 'agent.fundi_assigned',
      agentId,
      jobId,
      fundiId,
    });

    return result.rows[0]!;
  }

  /** Agent performance metrics */
  async getAgentPerformance(agentId: string) {
    const result = await query<{
      total_dispatched: string;
      completed: string;
      cancelled: string;
      total_gmv: string;
    }>(
      `SELECT
         COUNT(*) as total_dispatched,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
         COALESCE(SUM(quoted_amount_tzs), 0) as total_gmv
       FROM jobs
       WHERE agent_id = $1`,
      [agentId],
    );

    const row = result.rows[0]!;
    return {
      total_dispatched: parseInt(row.total_dispatched, 10),
      completed: parseInt(row.completed, 10),
      cancelled: parseInt(row.cancelled, 10),
      total_gmv_tzs: parseInt(row.total_gmv, 10),
    };
  }
}

export const agentService = new AgentService();
