import { query, getClient } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { enqueueNotification, scheduleEscrowRelease } from '../jobs/queue.js';
import { calculateFees } from '@fundi-wangu/utils';
import { JOB_STATUS_TRANSITIONS, PLATFORM_DEFAULTS } from '@fundi-wangu/shared-types';
import type { Job, JobStatus } from '@fundi-wangu/shared-types';

interface CreateJobData {
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
}

class JobService {
  // ──────────────────────────────────────────────
  // Job creation
  // ──────────────────────────────────────────────

  async createJob(customerId: string, data: CreateJobData): Promise<Job> {
    // Calculate fees based on estimated amount
    // In a real implementation, quoted_amount would come from service prices
    const quotedAmount = await this.calculateQuotedAmount(data.service_items);
    const fees = calculateFees(
      quotedAmount,
      PLATFORM_DEFAULTS.platformFeePercent,
      PLATFORM_DEFAULTS.vatPercent,
    );

    const result = await query<Job>(
      `INSERT INTO jobs (
        customer_id, category, service_items, description_text, description_photos,
        location, address_text, address_district, address_ward,
        scheduled_at, quoted_amount_tzs, platform_fee_tzs, vat_tzs,
        net_to_fundi_tzs, payment_method, is_womens_filter
      ) VALUES (
        $1, $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
        $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        customerId,
        data.category,
        JSON.stringify(data.service_items),
        data.description_text,
        data.description_photos ?? [],
        data.longitude,
        data.latitude,
        data.address_text,
        data.address_district ?? null,
        data.address_ward ?? null,
        data.scheduled_at ?? null,
        fees.grossAmountTzs,
        fees.platformFeeTzs,
        fees.vatTzs,
        fees.netToFundiTzs,
        data.payment_method,
        data.is_womens_filter ?? false,
      ],
    );

    const job = result.rows[0]!;

    logger.info({
      event: 'job.created',
      jobId: job.id,
      jobReference: job.job_reference,
      customerId,
      category: data.category,
      quotedAmountTzs: fees.grossAmountTzs,
    });

    return job;
  }

  /** Calculate quoted amount from service items */
  private async calculateQuotedAmount(serviceItems: { fundi_service_id: string; quantity: number }[]): Promise<number> {
    if (serviceItems.length === 0) {
      return 0;
    }

    const ids = serviceItems.map((s) => s.fundi_service_id);
    const result = await query<{ id: string; price_tzs: number | null }>(
      'SELECT id, price_tzs FROM fundi_services WHERE id = ANY($1)',
      [ids],
    );

    let total = 0;
    for (const item of serviceItems) {
      const service = result.rows.find((r) => r.id === item.fundi_service_id);
      if (service?.price_tzs) {
        total += service.price_tzs * item.quantity;
      }
    }

    // Minimum job amount: TZS 5,000
    return Math.max(total, 5000);
  }

  // ──────────────────────────────────────────────
  // Job assignment algorithm
  // ──────────────────────────────────────────────

  /**
   * Find and assign the best available Fundi for a job.
   * Algorithm:
   *   1. Query active Mafundi within radius, matching category, tier >= tier2_id
   *   2. Score: (0.4 * rating) + (0.3 * acceptance_rate) + (0.2 * completion_rate) + (0.1 * proximity)
   *   3. Apply filters (women-only, verified-only)
   *   4. Select top-ranked Fundi -> send job request -> wait 90s
   *   5. If no response -> next Fundi in list
   *   6. Max 3 attempts -> notify customer
   */
  async assignJob(jobId: string): Promise<{ assigned: boolean; fundiId?: string }> {
    const jobResult = await query<Job>('SELECT * FROM jobs WHERE id = $1', [jobId]);
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(404, 'Job not found.', 'Kazi haipatikani.', 'JOB_NOT_FOUND');
    }

    // Find eligible Mafundi ranked by scoring algorithm
    const candidates = await query<{
      user_id: string;
      name: string;
      distance_km: number;
      match_score: number;
    }>(
      `SELECT
        fp.user_id,
        u.name,
        ROUND((ST_Distance(fp.current_location, $1::geography) / 1000)::numeric, 1) AS distance_km,
        (0.4 * COALESCE(fp.overall_rating, 0) / 5
         + 0.3 * COALESCE(fp.acceptance_rate, 0) / 100
         + 0.2 * COALESCE(fp.completion_rate, 0) / 100
         + 0.1 * (1 - LEAST(ST_Distance(fp.current_location, $1::geography) / 50000, 1))
        ) AS match_score
       FROM fundi_profiles fp
       JOIN users u ON u.id = fp.user_id AND u.is_active = true AND u.is_suspended = false
       WHERE fp.online_status = true
         AND fp.verification_tier IN ('tier2_id', 'tier3_certified')
         AND $2 = ANY(fp.service_categories)
         AND ST_DWithin(fp.current_location, $1::geography, fp.service_radius_km * 1000)
         AND (fp.holiday_mode_until IS NULL OR fp.holiday_mode_until < NOW())
         ${job.is_womens_filter ? "AND u.profile_photo_url IS NOT NULL" : ''}
         AND fp.user_id NOT IN (
           SELECT fundi_id FROM job_assignment_log WHERE job_id = $3 AND response = 'declined'
         )
       ORDER BY match_score DESC
       LIMIT 3`,
      [
        `SRID=4326;POINT(${job.location})`, // PostGIS geography from job
        job.category,
        jobId,
      ],
    );

    if (candidates.rows.length === 0) {
      logger.info({ event: 'job.no_fundi_available', jobId, jobReference: job.job_reference });
      return { assigned: false };
    }

    // Send job request to top candidate
    const topCandidate = candidates.rows[0]!;

    // Notify the Fundi about the new job request
    await enqueueNotification({
      userId: topCandidate.user_id,
      templateKey: 'JOB_REQUEST',
      variables: {
        category: job.category,
        distance: String(topCandidate.distance_km),
        amount: String(job.quoted_amount_tzs),
        jobRef: job.job_reference,
      },
      channels: ['push', 'sms'], // SMS is mandatory for job alerts
      priority: 'high',
    });

    logger.info({
      event: 'job.assignment_requested',
      jobId,
      jobReference: job.job_reference,
      fundiId: topCandidate.user_id,
      matchScore: topCandidate.match_score,
      distanceKm: topCandidate.distance_km,
    });

    return { assigned: true, fundiId: topCandidate.user_id };
  }

  // ──────────────────────────────────────────────
  // Job status state machine
  // ──────────────────────────────────────────────

  /**
   * Transition a job's status with full validation.
   * Enforces the state machine defined in JOB_STATUS_TRANSITIONS.
   * Records timestamps for each transition.
   */
  async updateStatus(
    jobId: string,
    userId: string,
    userRole: string,
    newStatus: JobStatus,
    extras?: { cancellation_reason?: string; photos?: string[]; notes?: string },
  ): Promise<Job> {
    const jobResult = await query<Job>('SELECT * FROM jobs WHERE id = $1', [jobId]);
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(404, 'Job not found.', 'Kazi haipatikani.', 'JOB_NOT_FOUND');
    }

    // Validate state transition
    const currentStatus = job.status as JobStatus;
    const allowedTransitions = JOB_STATUS_TRANSITIONS[currentStatus];
    if (!allowedTransitions?.includes(newStatus)) {
      throw new AppError(
        400,
        `Cannot transition from '${currentStatus}' to '${newStatus}'.`,
        `Haiwezekani kubadili hali kutoka '${currentStatus}' kwenda '${newStatus}'.`,
        'INVALID_STATUS_TRANSITION',
      );
    }

    // Role-based transition permissions
    this.validateRolePermission(userRole, userId, job, newStatus);

    // Build the update
    const updates: string[] = ['status = $1'];
    const values: unknown[] = [newStatus];
    let idx = 2;

    // Set timestamp for the transition
    const timestampField = this.getTimestampField(newStatus);
    if (timestampField) {
      updates.push(`${timestampField} = NOW()`);
    }

    // Handle specific transitions
    switch (newStatus) {
      case 'accepted':
        updates.push(`fundi_id = $${idx}`);
        values.push(userId);
        idx++;
        break;

      case 'cancelled':
        updates.push(`cancelled_by = $${idx}`);
        values.push(userId);
        idx++;
        if (extras?.cancellation_reason) {
          updates.push(`cancellation_reason = $${idx}`);
          values.push(extras.cancellation_reason);
          idx++;
        }
        break;

      case 'completed':
        if (extras?.photos) {
          updates.push(`completion_photos = $${idx}`);
          values.push(extras.photos);
          idx++;
        }
        if (extras?.notes) {
          updates.push(`fundi_notes = $${idx}`);
          values.push(extras.notes);
          idx++;
        }
        // Set escrow release timer — auto-releases after 24 hours if no dispute
        updates.push(`escrow_release_at = NOW() + INTERVAL '${PLATFORM_DEFAULTS.escrowAutoReleaseHours} hours'`);
        break;

      case 'disputed':
        updates.push('escrow_release_at = NULL'); // Freeze escrow
        break;
    }

    values.push(jobId);
    const result = await query<Job>(
      `UPDATE jobs SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    const updatedJob = result.rows[0]!;

    // Post-transition side effects
    await this.handlePostTransition(updatedJob, currentStatus, newStatus);

    logger.info({
      event: 'job.status_changed',
      jobId,
      jobReference: updatedJob.job_reference,
      fromStatus: currentStatus,
      toStatus: newStatus,
      userId,
    });

    return updatedJob;
  }

  /** Validate that the user's role permits this transition */
  private validateRolePermission(
    userRole: string,
    userId: string,
    job: Job,
    newStatus: JobStatus,
  ): void {
    const fundiStatuses: JobStatus[] = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
    const customerStatuses: JobStatus[] = ['completed', 'cancelled'];

    if (userRole === 'fundi') {
      if (!fundiStatuses.includes(newStatus)) {
        throw new AppError(403, 'Fundis cannot set this status.', 'Mafundi hawawezi kuweka hali hii.', 'FORBIDDEN_STATUS');
      }
      // For 'accepted', fundi doesn't need to be assigned yet
      if (newStatus !== 'accepted' && job.fundi_id !== userId) {
        throw new AppError(403, 'You are not assigned to this job.', 'Hukupangiwa kazi hii.', 'NOT_ASSIGNED');
      }
    } else if (userRole === 'customer') {
      if (!customerStatuses.includes(newStatus)) {
        throw new AppError(403, 'Customers cannot set this status.', 'Wateja hawawezi kuweka hali hii.', 'FORBIDDEN_STATUS');
      }
      if (job.customer_id !== userId) {
        throw new AppError(403, 'This is not your job.', 'Hii si kazi yako.', 'NOT_YOUR_JOB');
      }
    }
  }

  /** Map job status to the corresponding timestamp column */
  private getTimestampField(status: JobStatus): string | null {
    const map: Partial<Record<JobStatus, string>> = {
      accepted: 'accepted_at',
      en_route: 'en_route_at',
      arrived: 'arrived_at',
      in_progress: 'started_at',
      completed: 'completed_at',
      cancelled: 'cancelled_at',
      disputed: 'disputed_at',
    };
    return map[status] ?? null;
  }

  /** Trigger side effects after a status transition (notifications, escrow, etc.) */
  private async handlePostTransition(
    job: Job,
    fromStatus: JobStatus,
    toStatus: JobStatus,
  ): Promise<void> {
    switch (toStatus) {
      case 'accepted':
        // Notify customer that Fundi accepted
        await enqueueNotification({
          userId: job.customer_id,
          templateKey: 'JOB_CONFIRMED',
          variables: { jobRef: job.job_reference, fundiName: 'Fundi' },
          channels: ['push'],
          priority: 'high',
        });
        break;

      case 'en_route':
        await enqueueNotification({
          userId: job.customer_id,
          templateKey: 'FUNDI_EN_ROUTE',
          variables: { jobRef: job.job_reference, fundiName: 'Fundi', eta: '15' },
          channels: ['push'],
          priority: 'high',
        });
        break;

      case 'arrived':
        await enqueueNotification({
          userId: job.customer_id,
          templateKey: 'FUNDI_ARRIVED',
          variables: { jobRef: job.job_reference, fundiName: 'Fundi' },
          channels: ['push'],
          priority: 'high',
        });
        break;

      case 'completed':
        // Notify customer to rate + schedule escrow release
        await enqueueNotification({
          userId: job.customer_id,
          templateKey: 'JOB_COMPLETED',
          variables: { jobRef: job.job_reference },
          channels: ['push'],
          priority: 'normal',
        });

        if (job.escrow_release_at) {
          await scheduleEscrowRelease({
            jobId: job.id,
            releaseAt: new Date(job.escrow_release_at),
          });
        }
        break;

      case 'cancelled':
        // Notify the other party
        const notifyUserId = job.cancelled_by === job.customer_id ? job.fundi_id : job.customer_id;
        if (notifyUserId) {
          await enqueueNotification({
            userId: notifyUserId,
            templateKey: 'JOB_CANCELLED',
            variables: { jobRef: job.job_reference },
            channels: ['push', 'sms'],
            priority: 'high',
          });
        }
        break;
    }
  }

  // ──────────────────────────────────────────────
  // Scope changes
  // ──────────────────────────────────────────────

  /**
   * Fundi requests a scope change (additional work discovered on-site).
   * Customer must approve before the amount is adjusted.
   */
  async requestScopeChange(
    jobId: string,
    fundiId: string,
    additionalAmountTzs: number,
    reason: string,
  ): Promise<Job> {
    const jobResult = await query<Job>(
      `SELECT * FROM jobs WHERE id = $1 AND fundi_id = $2 AND status = 'in_progress'`,
      [jobId, fundiId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'In-progress job not found or not assigned to you.',
        'Kazi inayoendelea haipatikani au si yako.',
        'JOB_NOT_FOUND',
      );
    }

    const fees = calculateFees(
      additionalAmountTzs,
      PLATFORM_DEFAULTS.platformFeePercent,
      PLATFORM_DEFAULTS.vatPercent,
    );

    const result = await query<Job>(
      `UPDATE jobs SET
        scope_change_amount_tzs = $1,
        scope_change_reason = $2,
        scope_change_status = 'pending'
       WHERE id = $3 RETURNING *`,
      [fees.grossAmountTzs, reason, jobId],
    );

    // Notify customer about scope change request
    await enqueueNotification({
      userId: job.customer_id,
      templateKey: 'JOB_CONFIRMED', // Reuse template, customize via variables
      variables: {
        jobRef: job.job_reference,
        fundiName: 'Fundi',
      },
      channels: ['push'],
      priority: 'high',
    });

    logger.info({
      event: 'job.scope_change_requested',
      jobId,
      fundiId,
      additionalAmount: fees.grossAmountTzs,
      reason,
    });

    return result.rows[0]!;
  }

  /** Customer approves a scope change */
  async approveScopeChange(jobId: string, customerId: string): Promise<Job> {
    const jobResult = await query<Job>(
      `SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND scope_change_status = 'pending'`,
      [jobId, customerId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'No pending scope change found.',
        'Hakuna mabadiliko yanayosubiri.',
        'NO_PENDING_SCOPE_CHANGE',
      );
    }

    const newQuotedAmount = job.quoted_amount_tzs + (job as Record<string, unknown>).scope_change_amount_tzs as number;
    const fees = calculateFees(
      newQuotedAmount,
      PLATFORM_DEFAULTS.platformFeePercent,
      PLATFORM_DEFAULTS.vatPercent,
    );

    const result = await query<Job>(
      `UPDATE jobs SET
        quoted_amount_tzs = $1,
        platform_fee_tzs = $2,
        vat_tzs = $3,
        net_to_fundi_tzs = $4,
        scope_change_status = 'approved'
       WHERE id = $5 RETURNING *`,
      [fees.grossAmountTzs, fees.platformFeeTzs, fees.vatTzs, fees.netToFundiTzs, jobId],
    );

    logger.info({
      event: 'job.scope_change_approved',
      jobId,
      customerId,
      newQuotedAmount: fees.grossAmountTzs,
    });

    return result.rows[0]!;
  }

  // ──────────────────────────────────────────────
  // Job queries
  // ──────────────────────────────────────────────

  async getJob(jobId: string, userId: string): Promise<Job> {
    const result = await query<Job>(
      'SELECT * FROM jobs WHERE id = $1 AND (customer_id = $2 OR fundi_id = $2)',
      [jobId, userId],
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'Job not found.', 'Kazi haipatikani.', 'JOB_NOT_FOUND');
    }

    return result.rows[0];
  }

  async listJobs(
    userId: string,
    role: string,
    status?: string,
    page: number = 1,
    perPage: number = 20,
  ) {
    const offset = (page - 1) * perPage;
    const userField = role === 'fundi' ? 'fundi_id' : 'customer_id';

    const conditions = [`${userField} = $1`];
    const values: unknown[] = [userId];
    let idx = 2;

    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }

    const whereClause = conditions.join(' AND ');

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM jobs WHERE ${whereClause}`, values),
      query(
        `SELECT * FROM jobs WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, perPage, offset],
      ),
    ]);

    return {
      success: true,
      data: dataResult.rows,
      meta: { page, per_page: perPage, total: parseInt(countResult.rows[0]?.count ?? '0', 10) },
      error: null,
    };
  }
}

export const jobService = new JobService();
