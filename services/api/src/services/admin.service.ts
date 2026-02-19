import { query, getClient } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { enqueueNotification } from '../jobs/queue.js';
import { payoutQueue } from '../jobs/queue.js';
import type {
  Dispute,
  FundiProfile,
  Job,
  PaymentTransaction,
  PayoutRequest,
  PlatformConfig,
  User,
} from '@fundi-wangu/shared-types';

class AdminService {
  // ──────────────────────────────────────────────
  // Live job map
  // ──────────────────────────────────────────────

  /** Get all active jobs for the live operations map */
  async getLiveJobs(filters?: { status?: string; category?: string; district?: string }) {
    const conditions = [`j.status NOT IN ('completed', 'cancelled')`];
    const values: unknown[] = [];
    let idx = 1;

    if (filters?.status) {
      conditions.push(`j.status = $${idx}`);
      values.push(filters.status);
      idx++;
    }
    if (filters?.category) {
      conditions.push(`j.category = $${idx}`);
      values.push(filters.category);
      idx++;
    }
    if (filters?.district) {
      conditions.push(`j.address_district = $${idx}`);
      values.push(filters.district);
      idx++;
    }

    const result = await query<Job & { customer_name: string; fundi_name: string | null }>(
      `SELECT j.*,
              cu.name as customer_name,
              fu.name as fundi_name
       FROM jobs j
       JOIN users cu ON cu.id = j.customer_id
       LEFT JOIN users fu ON fu.id = j.fundi_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY j.created_at DESC
       LIMIT 500`,
      values,
    );

    return result.rows;
  }

  // ──────────────────────────────────────────────
  // Fundi verification queue
  // ──────────────────────────────────────────────

  /** List Fundi profiles awaiting NIN verification (tier1_phone → tier2_id) */
  async getVerificationQueue(page: number = 1, perPage: number = 20) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM fundi_profiles
         WHERE verification_tier = 'tier1_phone'
         AND national_id_number IS NOT NULL`,
      ),
      query<FundiProfile & { user_name: string; phone_number: string }>(
        `SELECT fp.*, u.name as user_name, u.phone_number
         FROM fundi_profiles fp
         JOIN users u ON u.id = fp.user_id
         WHERE fp.verification_tier = 'tier1_phone'
         AND fp.national_id_number IS NOT NULL
         ORDER BY fp.created_at ASC
         LIMIT $1 OFFSET $2`,
        [perPage, offset],
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

  /** Approve or reject a Fundi's NIN verification */
  async verifyUser(
    adminId: string,
    targetUserId: string,
    action: 'approve' | 'reject',
    reason?: string,
  ): Promise<FundiProfile> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const profileResult = await client.query<FundiProfile>(
        `SELECT * FROM fundi_profiles WHERE user_id = $1 FOR UPDATE`,
        [targetUserId],
      );
      const profile = profileResult.rows[0];

      if (!profile) {
        throw new AppError(404, 'Fundi profile not found.', 'Wasifu wa fundi haupatikani.', 'PROFILE_NOT_FOUND');
      }

      if (action === 'approve') {
        await client.query(
          `UPDATE fundi_profiles
           SET verification_tier = 'tier2_id',
               nin_verified_at = NOW(),
               nin_verified_by = $1
           WHERE user_id = $2`,
          [adminId, targetUserId],
        );

        await enqueueNotification({
          userId: targetUserId,
          templateKey: 'VERIFICATION_APPROVED',
          variables: {},
          channels: ['push', 'sms'],
          priority: 'high',
        });
      } else {
        await enqueueNotification({
          userId: targetUserId,
          templateKey: 'VERIFICATION_REJECTED',
          variables: {},
          channels: ['push', 'sms'],
          priority: 'high',
        });
      }

      // Audit log
      await client.query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
         VALUES ($1, $2, 'fundi_profile', $3, $4)`,
        [
          adminId,
          action === 'approve' ? 'verification.approved' : 'verification.rejected',
          targetUserId,
          JSON.stringify({ action, reason: reason ?? null }),
        ],
      );

      await client.query('COMMIT');

      const updatedResult = await query<FundiProfile>(
        'SELECT * FROM fundi_profiles WHERE user_id = $1',
        [targetUserId],
      );

      logger.info({
        event: `admin.verification.${action}`,
        adminId,
        targetUserId,
        reason,
      });

      return updatedResult.rows[0]!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────
  // User suspension
  // ──────────────────────────────────────────────

  /** Suspend or unsuspend a user */
  async suspendUser(
    adminId: string,
    targetUserId: string,
    action: 'suspend' | 'unsuspend',
    reason?: string,
  ): Promise<User> {
    const isSuspend = action === 'suspend';

    const client = await getClient();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users SET is_suspended = $1, suspension_reason = $2 WHERE id = $3`,
        [isSuspend, isSuspend ? (reason ?? null) : null, targetUserId],
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
         VALUES ($1, $2, 'user', $3, $4)`,
        [
          adminId,
          `user.${action}`,
          targetUserId,
          JSON.stringify({ action, reason: reason ?? null }),
        ],
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    const result = await query<User>('SELECT * FROM users WHERE id = $1', [targetUserId]);

    if (!result.rows[0]) {
      throw new AppError(404, 'User not found.', 'Mtumiaji hapatikani.', 'USER_NOT_FOUND');
    }

    logger.info({
      event: `admin.user.${action}`,
      adminId,
      targetUserId,
      reason,
    });

    return result.rows[0];
  }

  // ──────────────────────────────────────────────
  // Dispute resolution
  // ──────────────────────────────────────────────

  /** List all disputes (admin view) */
  async listAllDisputes(page: number = 1, perPage: number = 20, status?: string) {
    const offset = (page - 1) * perPage;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`d.status = $${idx}`);
      values.push(status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM disputes d ${whereClause}`, values),
      query<Dispute & { job_reference: string; customer_name: string; fundi_name: string | null }>(
        `SELECT d.*, j.job_reference, cu.name as customer_name, fu.name as fundi_name
         FROM disputes d
         JOIN jobs j ON j.id = d.job_id
         JOIN users cu ON cu.id = j.customer_id
         LEFT JOIN users fu ON fu.id = j.fundi_id
         ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, perPage, offset],
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

  /** Resolve a dispute (admin only) — trigger fund movement */
  async resolveDispute(
    adminId: string,
    disputeId: string,
    data: {
      resolution: 'refund_customer' | 'release_to_fundi' | 'split' | 'escalate';
      resolution_notes: string;
      resolution_amount_customer_tzs?: number;
      resolution_amount_fundi_tzs?: number;
    },
  ): Promise<Dispute> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const disputeResult = await client.query<Dispute>(
        `SELECT * FROM disputes WHERE id = $1 FOR UPDATE`,
        [disputeId],
      );
      const dispute = disputeResult.rows[0];

      if (!dispute) {
        throw new AppError(404, 'Dispute not found.', 'Malalamiko hayapatikani.', 'DISPUTE_NOT_FOUND');
      }

      if (dispute.status !== 'open' && dispute.status !== 'under_review') {
        throw new AppError(
          400,
          'Dispute is already resolved.',
          'Malalamiko tayari yametatuliwa.',
          'DISPUTE_ALREADY_RESOLVED',
        );
      }

      // Map resolution action to dispute status
      let newStatus: string;
      switch (data.resolution) {
        case 'refund_customer':
          newStatus = 'resolved_customer';
          break;
        case 'release_to_fundi':
          newStatus = 'resolved_fundi';
          break;
        case 'split':
          newStatus = 'resolved_customer'; // Partial resolution
          break;
        case 'escalate':
          newStatus = 'escalated';
          break;
        default:
          newStatus = 'resolved_customer';
      }

      // Update dispute record
      await client.query(
        `UPDATE disputes SET
          status = $1,
          resolution = $2,
          resolved_by_id = $3,
          resolved_at = NOW(),
          resolution_amount_customer_tzs = $4,
          resolution_amount_fundi_tzs = $5
         WHERE id = $6`,
        [
          newStatus,
          data.resolution_notes,
          adminId,
          data.resolution_amount_customer_tzs ?? null,
          data.resolution_amount_fundi_tzs ?? null,
          disputeId,
        ],
      );

      // Handle fund movement based on resolution
      const jobResult = await client.query<Job>(
        'SELECT * FROM jobs WHERE id = $1',
        [dispute.job_id],
      );
      const job = jobResult.rows[0]!;

      if (data.resolution === 'release_to_fundi' && job.fundi_id) {
        // Release full escrow to Fundi
        const escrowTx = await client.query<PaymentTransaction>(
          `SELECT * FROM payment_transactions
           WHERE job_id = $1 AND direction = 'customer_to_escrow' AND status = 'held_escrow'`,
          [dispute.job_id],
        );
        if (escrowTx.rows[0]) {
          await client.query(
            `UPDATE payment_transactions SET status = 'released' WHERE id = $1`,
            [escrowTx.rows[0].id],
          );
          await client.query(
            `INSERT INTO fundi_wallets (fundi_id, balance_tzs, pending_tzs, total_earned_tzs)
             VALUES ($1, $2, 0, $2)
             ON CONFLICT (fundi_id)
             DO UPDATE SET
               balance_tzs = fundi_wallets.balance_tzs + $2,
               total_earned_tzs = fundi_wallets.total_earned_tzs + $2,
               updated_at = NOW()`,
            [job.fundi_id, escrowTx.rows[0].net_tzs],
          );
        }
      } else if (data.resolution === 'refund_customer') {
        // Refund to customer
        await client.query(
          `UPDATE payment_transactions
           SET status = 'refunded'
           WHERE job_id = $1 AND direction = 'customer_to_escrow' AND status = 'held_escrow'`,
          [dispute.job_id],
        );
      } else if (data.resolution === 'split' && job.fundi_id) {
        // Split: partial amounts
        const escrowTx = await client.query<PaymentTransaction>(
          `SELECT * FROM payment_transactions
           WHERE job_id = $1 AND direction = 'customer_to_escrow' AND status = 'held_escrow'`,
          [dispute.job_id],
        );
        if (escrowTx.rows[0]) {
          await client.query(
            `UPDATE payment_transactions SET status = 'released' WHERE id = $1`,
            [escrowTx.rows[0].id],
          );
          if (data.resolution_amount_fundi_tzs) {
            await client.query(
              `INSERT INTO fundi_wallets (fundi_id, balance_tzs, pending_tzs, total_earned_tzs)
               VALUES ($1, $2, 0, $2)
               ON CONFLICT (fundi_id)
               DO UPDATE SET
                 balance_tzs = fundi_wallets.balance_tzs + $2,
                 total_earned_tzs = fundi_wallets.total_earned_tzs + $2,
                 updated_at = NOW()`,
              [job.fundi_id, data.resolution_amount_fundi_tzs],
            );
          }
        }
      }

      // Audit log
      await client.query(
        `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
         VALUES ($1, 'dispute.resolved', 'dispute', $2, $3)`,
        [adminId, disputeId, JSON.stringify(data)],
      );

      await client.query('COMMIT');

      // Notify both parties
      if (job.customer_id) {
        await enqueueNotification({
          userId: job.customer_id,
          templateKey: 'DISPUTE_RESOLVED',
          variables: { jobRef: job.job_reference },
          channels: ['push', 'sms'],
          priority: 'high',
        });
      }
      if (job.fundi_id) {
        await enqueueNotification({
          userId: job.fundi_id,
          templateKey: 'DISPUTE_RESOLVED',
          variables: { jobRef: job.job_reference },
          channels: ['push', 'sms'],
          priority: 'high',
        });
      }

      logger.info({
        event: 'admin.dispute.resolved',
        adminId,
        disputeId,
        resolution: data.resolution,
      });

      const updatedDispute = await query<Dispute>(
        'SELECT * FROM disputes WHERE id = $1',
        [disputeId],
      );
      return updatedDispute.rows[0]!;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────
  // Finance dashboard
  // ──────────────────────────────────────────────

  /** Platform finance overview */
  async getFinanceDashboard(period?: string) {
    const periodFilter = period === 'week'
      ? `AND pt.created_at >= NOW() - INTERVAL '7 days'`
      : period === 'month'
        ? `AND pt.created_at >= NOW() - INTERVAL '30 days'`
        : '';

    const [revenue, refunds, jobStats] = await Promise.all([
      query<{
        total_gmv: string;
        platform_fees: string;
        vat_collected: string;
        net_to_fundis: string;
      }>(
        `SELECT
           COALESCE(SUM(amount_tzs), 0) as total_gmv,
           COALESCE(SUM(platform_fee_tzs), 0) as platform_fees,
           COALESCE(SUM(vat_tzs), 0) as vat_collected,
           COALESCE(SUM(net_tzs), 0) as net_to_fundis
         FROM payment_transactions
         WHERE direction = 'customer_to_escrow'
         AND status IN ('held_escrow', 'released')
         ${periodFilter}`,
      ),
      query<{ total_refunds: string; refund_count: string }>(
        `SELECT
           COALESCE(SUM(amount_tzs), 0) as total_refunds,
           COUNT(*) as refund_count
         FROM payment_transactions
         WHERE status = 'refunded'
         ${periodFilter}`,
      ),
      query<{ total_jobs: string; completed: string; cancelled: string; disputed: string }>(
        `SELECT
           COUNT(*) as total_jobs,
           COUNT(*) FILTER (WHERE status = 'completed') as completed,
           COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
           COUNT(*) FILTER (WHERE status = 'disputed') as disputed
         FROM jobs
         WHERE created_at >= NOW() - INTERVAL '30 days'`,
      ),
    ]);

    return {
      revenue: {
        total_gmv_tzs: parseInt(revenue.rows[0]?.total_gmv ?? '0', 10),
        platform_fees_tzs: parseInt(revenue.rows[0]?.platform_fees ?? '0', 10),
        vat_collected_tzs: parseInt(revenue.rows[0]?.vat_collected ?? '0', 10),
        net_to_fundis_tzs: parseInt(revenue.rows[0]?.net_to_fundis ?? '0', 10),
      },
      refunds: {
        total_refunds_tzs: parseInt(refunds.rows[0]?.total_refunds ?? '0', 10),
        refund_count: parseInt(refunds.rows[0]?.refund_count ?? '0', 10),
      },
      jobs: {
        total: parseInt(jobStats.rows[0]?.total_jobs ?? '0', 10),
        completed: parseInt(jobStats.rows[0]?.completed ?? '0', 10),
        cancelled: parseInt(jobStats.rows[0]?.cancelled ?? '0', 10),
        disputed: parseInt(jobStats.rows[0]?.disputed ?? '0', 10),
      },
    };
  }

  // ──────────────────────────────────────────────
  // Payout queue
  // ──────────────────────────────────────────────

  /** List pending payout requests */
  async getPayoutQueue(page: number = 1, perPage: number = 20) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM payout_requests WHERE status = 'pending'`,
      ),
      query<PayoutRequest & { fundi_name: string; phone_number: string }>(
        `SELECT pr.*, u.name as fundi_name, u.phone_number
         FROM payout_requests pr
         JOIN users u ON u.id = pr.fundi_id
         WHERE pr.status = 'pending'
         ORDER BY pr.requested_at ASC
         LIMIT $1 OFFSET $2`,
        [perPage, offset],
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

  /** Process a payout (enqueue for B2C transfer) */
  async processPayout(adminId: string, payoutId: string): Promise<PayoutRequest> {
    const result = await query<PayoutRequest>(
      `SELECT * FROM payout_requests WHERE id = $1 AND status = 'pending'`,
      [payoutId],
    );
    const payout = result.rows[0];

    if (!payout) {
      throw new AppError(
        404,
        'Pending payout not found.',
        'Malipo yanayosubiri hayapatikani.',
        'PAYOUT_NOT_FOUND',
      );
    }

    // Enqueue for async B2C processing
    await payoutQueue.add('process', {
      payoutId: payout.id,
      fundiId: payout.fundi_id,
      amountTzs: payout.amount_tzs,
      payoutNetwork: payout.payout_network,
      payoutNumber: payout.payout_number,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    // Audit log
    await query(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'payout.processed', 'payout_request', $2, $3)`,
      [adminId, payoutId, JSON.stringify({ amount: payout.amount_tzs })],
    );

    logger.info({
      event: 'admin.payout.processed',
      adminId,
      payoutId,
      fundiId: payout.fundi_id,
      amount: payout.amount_tzs,
    });

    return payout;
  }

  // ──────────────────────────────────────────────
  // Analytics
  // ──────────────────────────────────────────────

  /** Category performance metrics */
  async getCategoryAnalytics() {
    const result = await query<{
      category: string;
      total_jobs: string;
      completed_jobs: string;
      avg_rating: string;
      total_gmv: string;
      avg_completion_time_hours: string;
    }>(
      `SELECT
         j.category,
         COUNT(*) as total_jobs,
         COUNT(*) FILTER (WHERE j.status = 'completed') as completed_jobs,
         ROUND(AVG(r.rating)::numeric, 1) as avg_rating,
         COALESCE(SUM(j.quoted_amount_tzs), 0) as total_gmv,
         ROUND(AVG(EXTRACT(EPOCH FROM (j.completed_at - j.accepted_at)) / 3600)::numeric, 1) as avg_completion_time_hours
       FROM jobs j
       LEFT JOIN reviews r ON r.job_id = j.id
       WHERE j.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY j.category
       ORDER BY total_jobs DESC`,
    );

    return result.rows;
  }

  /** Platform health metrics */
  async getHealthMetrics() {
    const [users, fundis, activeJobs, todaySignups] = await Promise.all([
      query<{ total: string; active: string; suspended: string }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE is_active = true) as active,
           COUNT(*) FILTER (WHERE is_suspended = true) as suspended
         FROM users`,
      ),
      query<{ total: string; online: string; verified: string }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE online_status = true) as online,
           COUNT(*) FILTER (WHERE verification_tier IN ('tier2_id', 'tier3_certified')) as verified
         FROM fundi_profiles`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs WHERE status NOT IN ('completed', 'cancelled')`,
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE`,
      ),
    ]);

    return {
      users: {
        total: parseInt(users.rows[0]?.total ?? '0', 10),
        active: parseInt(users.rows[0]?.active ?? '0', 10),
        suspended: parseInt(users.rows[0]?.suspended ?? '0', 10),
      },
      fundis: {
        total: parseInt(fundis.rows[0]?.total ?? '0', 10),
        online: parseInt(fundis.rows[0]?.online ?? '0', 10),
        verified: parseInt(fundis.rows[0]?.verified ?? '0', 10),
      },
      active_jobs: parseInt(activeJobs.rows[0]?.count ?? '0', 10),
      today_signups: parseInt(todaySignups.rows[0]?.count ?? '0', 10),
    };
  }

  // ──────────────────────────────────────────────
  // Platform configuration
  // ──────────────────────────────────────────────

  /** List all platform config entries */
  async listConfig(): Promise<PlatformConfig[]> {
    const result = await query<PlatformConfig>(
      'SELECT * FROM platform_config ORDER BY key',
    );
    return result.rows;
  }

  /** Update a platform config value */
  async updateConfig(
    adminId: string,
    key: string,
    value: string,
  ): Promise<PlatformConfig> {
    // Get old value for audit
    const oldResult = await query<PlatformConfig>(
      'SELECT * FROM platform_config WHERE key = $1',
      [key],
    );

    if (!oldResult.rows[0]) {
      throw new AppError(
        404,
        `Config key '${key}' not found.`,
        `Ufunguo wa usanidi '${key}' haupatikani.`,
        'CONFIG_NOT_FOUND',
      );
    }

    const oldValue = oldResult.rows[0].value;

    const result = await query<PlatformConfig>(
      `UPDATE platform_config SET value = $1, updated_by = $2, updated_at = NOW()
       WHERE key = $3 RETURNING *`,
      [value, adminId, key],
    );

    // Audit log for financial config changes
    await query(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, old_value, new_value)
       VALUES ($1, 'config.updated', 'platform_config', $2, $3, $4)`,
      [adminId, key, JSON.stringify({ value: oldValue }), JSON.stringify({ value })],
    );

    logger.info({
      event: 'admin.config.updated',
      adminId,
      key,
      oldValue,
      newValue: value,
    });

    return result.rows[0]!;
  }
}

export const adminService = new AdminService();
