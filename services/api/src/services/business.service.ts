import { query, getClient } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import type {
  BusinessAccount,
  BusinessMember,
  BusinessProperty,
  BusinessFundiWhitelist,
  Job,
} from '@fundi-wangu/shared-types';

class BusinessService {
  // ──────────────────────────────────────────────
  // Business account CRUD
  // ──────────────────────────────────────────────

  /** Create a business account and register the user as owner */
  async createAccount(
    ownerId: string,
    data: {
      business_name: string;
      tin_number?: string;
      brela_number?: string;
      billing_email?: string;
      billing_address?: string;
    },
  ): Promise<BusinessAccount> {
    // Check if user already owns a business
    const existing = await query<BusinessAccount>(
      'SELECT id FROM business_accounts WHERE owner_id = $1',
      [ownerId],
    );

    if (existing.rows.length > 0) {
      throw new AppError(
        409,
        'You already have a business account.',
        'Tayari una akaunti ya biashara.',
        'DUPLICATE_BUSINESS',
      );
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query<BusinessAccount>(
        `INSERT INTO business_accounts (owner_id, business_name, tin_number, brela_number, billing_email, billing_address)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          ownerId,
          data.business_name,
          data.tin_number ?? null,
          data.brela_number ?? null,
          data.billing_email ?? null,
          data.billing_address ?? null,
        ],
      );

      const account = result.rows[0]!;

      // Add the owner as a business member
      await client.query(
        `INSERT INTO business_members (business_id, user_id, role)
         VALUES ($1, $2, 'owner')`,
        [account.id, ownerId],
      );

      await client.query('COMMIT');

      logger.info({
        event: 'business.created',
        businessId: account.id,
        ownerId,
        businessName: data.business_name,
      });

      return account;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Get the business account for a user */
  async getAccount(userId: string): Promise<BusinessAccount> {
    const result = await query<BusinessAccount>(
      `SELECT ba.* FROM business_accounts ba
       JOIN business_members bm ON bm.business_id = ba.id
       WHERE bm.user_id = $1`,
      [userId],
    );

    if (!result.rows[0]) {
      throw new AppError(
        404,
        'Business account not found.',
        'Akaunti ya biashara haipatikani.',
        'BUSINESS_NOT_FOUND',
      );
    }

    return result.rows[0];
  }

  /** Update business details */
  async updateAccount(
    userId: string,
    data: Partial<{
      business_name: string;
      tin_number: string;
      brela_number: string;
      billing_email: string;
      billing_address: string;
    }>,
  ): Promise<BusinessAccount> {
    const account = await this.getAccount(userId);
    await this.requireRole(userId, account.id, ['owner', 'manager']);

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) {
      throw new AppError(400, 'No fields to update.', 'Hakuna sehemu ya kusasisha.', 'NO_UPDATE_FIELDS');
    }

    values.push(account.id);
    const result = await query<BusinessAccount>(
      `UPDATE business_accounts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    return result.rows[0]!;
  }

  // ──────────────────────────────────────────────
  // Team members
  // ──────────────────────────────────────────────

  /** Add a team member by phone number */
  async addMember(
    userId: string,
    data: { phone_number: string; role: 'manager' | 'member' },
  ): Promise<BusinessMember> {
    const account = await this.getAccount(userId);

    // Only owners can add managers, managers can add members
    const memberRole = await this.getMemberRole(userId, account.id);
    if (data.role === 'manager' && memberRole !== 'owner') {
      throw new AppError(
        403,
        'Only the business owner can add managers.',
        'Mmiliki wa biashara tu ndiye anayeweza kuongeza wasimamizi.',
        'INSUFFICIENT_PERMISSION',
      );
    }

    // Find the user by phone
    const userResult = await query<{ id: string }>(
      'SELECT id FROM users WHERE phone_number = $1 AND is_active = true',
      [data.phone_number],
    );

    if (!userResult.rows[0]) {
      throw new AppError(
        404,
        'User with this phone number not found.',
        'Mtumiaji mwenye nambari hii haipatikani.',
        'USER_NOT_FOUND',
      );
    }

    const targetUserId = userResult.rows[0].id;

    // Check if already a member
    const existing = await query(
      'SELECT id FROM business_members WHERE business_id = $1 AND user_id = $2',
      [account.id, targetUserId],
    );

    if (existing.rows.length > 0) {
      throw new AppError(
        409,
        'This user is already a team member.',
        'Mtumiaji huyu tayari ni mwanachama.',
        'DUPLICATE_MEMBER',
      );
    }

    const result = await query<BusinessMember>(
      `INSERT INTO business_members (business_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [account.id, targetUserId, data.role],
    );

    logger.info({
      event: 'business.member_added',
      businessId: account.id,
      memberId: targetUserId,
      role: data.role,
      addedBy: userId,
    });

    return result.rows[0]!;
  }

  /** Remove a team member */
  async removeMember(userId: string, memberId: string): Promise<void> {
    const account = await this.getAccount(userId);
    await this.requireRole(userId, account.id, ['owner', 'manager']);

    // Cannot remove the owner
    const targetMember = await query<BusinessMember>(
      'SELECT * FROM business_members WHERE id = $1 AND business_id = $2',
      [memberId, account.id],
    );

    if (!targetMember.rows[0]) {
      throw new AppError(404, 'Team member not found.', 'Mwanachama hapatikani.', 'MEMBER_NOT_FOUND');
    }

    if (targetMember.rows[0].role === 'owner') {
      throw new AppError(
        403,
        'Cannot remove the business owner.',
        'Haiwezekani kumfuta mmiliki wa biashara.',
        'CANNOT_REMOVE_OWNER',
      );
    }

    await query('DELETE FROM business_members WHERE id = $1', [memberId]);

    logger.info({
      event: 'business.member_removed',
      businessId: account.id,
      memberId,
      removedBy: userId,
    });
  }

  /** List team members */
  async listMembers(userId: string): Promise<BusinessMember[]> {
    const account = await this.getAccount(userId);

    const result = await query<BusinessMember & { name: string; phone_number: string }>(
      `SELECT bm.*, u.name, u.phone_number
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id = $1
       ORDER BY bm.added_at`,
      [account.id],
    );

    return result.rows;
  }

  // ──────────────────────────────────────────────
  // Properties
  // ──────────────────────────────────────────────

  /** Register a property/managed location */
  async addProperty(
    userId: string,
    data: { name: string; address_text: string; latitude?: number; longitude?: number },
  ): Promise<BusinessProperty> {
    const account = await this.getAccount(userId);
    await this.requireRole(userId, account.id, ['owner', 'manager']);

    const hasLocation = data.latitude !== undefined && data.longitude !== undefined;

    const result = await query<BusinessProperty>(
      `INSERT INTO business_properties (business_id, name, address_text${hasLocation ? ', location' : ''})
       VALUES ($1, $2, $3${hasLocation ? ', ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography' : ''})
       RETURNING *`,
      hasLocation
        ? [account.id, data.name, data.address_text, data.longitude, data.latitude]
        : [account.id, data.name, data.address_text],
    );

    logger.info({
      event: 'business.property_added',
      businessId: account.id,
      propertyId: result.rows[0]!.id,
      name: data.name,
    });

    return result.rows[0]!;
  }

  /** List properties */
  async listProperties(userId: string): Promise<BusinessProperty[]> {
    const account = await this.getAccount(userId);
    const result = await query<BusinessProperty>(
      'SELECT * FROM business_properties WHERE business_id = $1 ORDER BY created_at',
      [account.id],
    );
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // Fundi whitelist
  // ──────────────────────────────────────────────

  /** Add a Fundi to the preferred whitelist */
  async addToWhitelist(
    userId: string,
    fundiId: string,
    propertyId?: string,
  ): Promise<BusinessFundiWhitelist> {
    const account = await this.getAccount(userId);
    await this.requireRole(userId, account.id, ['owner', 'manager']);

    // Verify the Fundi exists
    const fundiExists = await query(
      'SELECT id FROM users WHERE id = $1 AND role = $2 AND is_active = true',
      [fundiId, 'fundi'],
    );

    if (!fundiExists.rows[0]) {
      throw new AppError(404, 'Fundi not found.', 'Fundi hapatikani.', 'FUNDI_NOT_FOUND');
    }

    const result = await query<BusinessFundiWhitelist>(
      `INSERT INTO business_fundi_whitelist (business_id, fundi_id, property_id, added_by_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (business_id, fundi_id) DO NOTHING
       RETURNING *`,
      [account.id, fundiId, propertyId ?? null, userId],
    );

    if (!result.rows[0]) {
      throw new AppError(
        409,
        'Fundi is already on your whitelist.',
        'Fundi tayari yuko kwenye orodha yako.',
        'DUPLICATE_WHITELIST',
      );
    }

    logger.info({
      event: 'business.whitelist_added',
      businessId: account.id,
      fundiId,
      propertyId,
    });

    return result.rows[0];
  }

  /** Remove from whitelist */
  async removeFromWhitelist(userId: string, fundiId: string): Promise<void> {
    const account = await this.getAccount(userId);
    await this.requireRole(userId, account.id, ['owner', 'manager']);

    const result = await query(
      'DELETE FROM business_fundi_whitelist WHERE business_id = $1 AND fundi_id = $2',
      [account.id, fundiId],
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Fundi not on whitelist.', 'Fundi hayuko kwenye orodha.', 'NOT_WHITELISTED');
    }
  }

  /** List whitelisted Mafundi */
  async listWhitelist(userId: string) {
    const account = await this.getAccount(userId);
    const result = await query(
      `SELECT bfw.*, u.name as fundi_name, fp.overall_rating, fp.total_jobs_completed
       FROM business_fundi_whitelist bfw
       JOIN users u ON u.id = bfw.fundi_id
       JOIN fundi_profiles fp ON fp.user_id = bfw.fundi_id
       WHERE bfw.business_id = $1
       ORDER BY bfw.added_at`,
      [account.id],
    );
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // Business jobs and analytics
  // ──────────────────────────────────────────────

  /** List all jobs placed by any business member */
  async listBusinessJobs(userId: string, page: number = 1, perPage: number = 20) {
    const account = await this.getAccount(userId);
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs j
         JOIN business_members bm ON bm.user_id = j.customer_id AND bm.business_id = $1`,
        [account.id],
      ),
      query<Job>(
        `SELECT j.* FROM jobs j
         JOIN business_members bm ON bm.user_id = j.customer_id AND bm.business_id = $1
         ORDER BY j.created_at DESC
         LIMIT $2 OFFSET $3`,
        [account.id, perPage, offset],
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

  /** Business analytics (job volume, spend, category breakdown) */
  async getAnalytics(userId: string) {
    const account = await this.getAccount(userId);

    const [totalJobs, monthlySpend, categoryBreakdown] = await Promise.all([
      query<{ total: string; completed: string; cancelled: string }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE j.status = 'completed') as completed,
           COUNT(*) FILTER (WHERE j.status = 'cancelled') as cancelled
         FROM jobs j
         JOIN business_members bm ON bm.user_id = j.customer_id AND bm.business_id = $1`,
        [account.id],
      ),
      query<{ month: string; total_spend: string; job_count: string }>(
        `SELECT
           TO_CHAR(j.created_at, 'YYYY-MM') as month,
           COALESCE(SUM(j.quoted_amount_tzs), 0) as total_spend,
           COUNT(*) as job_count
         FROM jobs j
         JOIN business_members bm ON bm.user_id = j.customer_id AND bm.business_id = $1
         WHERE j.created_at >= NOW() - INTERVAL '12 months'
         GROUP BY TO_CHAR(j.created_at, 'YYYY-MM')
         ORDER BY month DESC`,
        [account.id],
      ),
      query<{ category: string; count: string; total_spend: string }>(
        `SELECT
           j.category,
           COUNT(*) as count,
           COALESCE(SUM(j.quoted_amount_tzs), 0) as total_spend
         FROM jobs j
         JOIN business_members bm ON bm.user_id = j.customer_id AND bm.business_id = $1
         GROUP BY j.category
         ORDER BY count DESC`,
        [account.id],
      ),
    ]);

    return {
      summary: {
        total_jobs: parseInt(totalJobs.rows[0]?.total ?? '0', 10),
        completed_jobs: parseInt(totalJobs.rows[0]?.completed ?? '0', 10),
        cancelled_jobs: parseInt(totalJobs.rows[0]?.cancelled ?? '0', 10),
      },
      monthly_spend: monthlySpend.rows,
      category_breakdown: categoryBreakdown.rows,
    };
  }

  // ──────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────

  private async getMemberRole(userId: string, businessId: string): Promise<string> {
    const result = await query<{ role: string }>(
      'SELECT role FROM business_members WHERE user_id = $1 AND business_id = $2',
      [userId, businessId],
    );
    return result.rows[0]?.role ?? '';
  }

  private async requireRole(userId: string, businessId: string, roles: string[]): Promise<void> {
    const role = await this.getMemberRole(userId, businessId);
    if (!roles.includes(role)) {
      throw new AppError(
        403,
        'You do not have permission for this action.',
        'Huna idhini ya hatua hii.',
        'INSUFFICIENT_BUSINESS_ROLE',
      );
    }
  }
}

export const businessService = new BusinessService();
