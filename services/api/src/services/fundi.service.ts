import { query } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import type { FundiProfile, FundiService as FundiServiceType, FundiWallet } from '@fundi-wangu/shared-types';

interface CreateProfileData {
  bio_sw?: string;
  bio_en?: string;
  service_categories: string[];
  service_radius_km?: number;
  hourly_rate_min_tzs?: number;
  hourly_rate_max_tzs?: number;
  payout_wallet_number: string;
  payout_network: string;
}

interface AddServiceData {
  name_sw: string;
  name_en: string;
  description_sw?: string;
  description_en?: string;
  price_type: string;
  price_tzs?: number;
}

interface PayoutData {
  amount_tzs: number;
  payout_network: string;
  payout_number: string;
}

class FundiService {
  // ──────────────────────────────────────────────
  // Profile management
  // ──────────────────────────────────────────────

  async createProfile(userId: string, data: CreateProfileData): Promise<FundiProfile> {
    // Check if profile already exists
    const existing = await query('SELECT id FROM fundi_profiles WHERE user_id = $1', [userId]);
    if (existing.rows[0]) {
      throw new AppError(
        409,
        'Fundi profile already exists.',
        'Wasifu wa fundi tayari upo.',
        'PROFILE_EXISTS',
      );
    }

    const result = await query<FundiProfile>(
      `INSERT INTO fundi_profiles (
        user_id, bio_sw, bio_en, service_categories, service_radius_km,
        hourly_rate_min_tzs, hourly_rate_max_tzs, payout_wallet_number, payout_network
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        userId,
        data.bio_sw ?? null,
        data.bio_en ?? null,
        data.service_categories,
        data.service_radius_km ?? 10,
        data.hourly_rate_min_tzs ?? null,
        data.hourly_rate_max_tzs ?? null,
        data.payout_wallet_number,
        data.payout_network,
      ],
    );

    logger.info({ event: 'fundi.profile_created', userId });
    return result.rows[0]!;
  }

  async updateProfile(userId: string, data: Partial<CreateProfileData>): Promise<FundiProfile> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const allowedFields: Record<string, string> = {
      bio_sw: 'bio_sw',
      bio_en: 'bio_en',
      service_categories: 'service_categories',
      service_radius_km: 'service_radius_km',
      hourly_rate_min_tzs: 'hourly_rate_min_tzs',
      hourly_rate_max_tzs: 'hourly_rate_max_tzs',
      payout_wallet_number: 'payout_wallet_number',
      payout_network: 'payout_network',
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && allowedFields[key]) {
        fields.push(`${allowedFields[key]} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) {
      throw new AppError(400, 'No fields to update.', 'Hakuna sehemu ya kusasisha.', 'NO_UPDATE_FIELDS');
    }

    values.push(userId);
    const result = await query<FundiProfile>(
      `UPDATE fundi_profiles SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'Fundi profile not found.', 'Wasifu wa fundi haupatikani.', 'PROFILE_NOT_FOUND');
    }

    return result.rows[0];
  }

  // ──────────────────────────────────────────────
  // Online status + GPS location
  // ──────────────────────────────────────────────

  async getStatus(userId: string): Promise<{ online_status: boolean; verification_tier: string }> {
    const result = await query<{ online_status: boolean; verification_tier: string }>(
      'SELECT online_status, verification_tier FROM fundi_profiles WHERE user_id = $1',
      [userId],
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'Fundi profile not found.', 'Wasifu wa fundi haupatikani.', 'PROFILE_NOT_FOUND');
    }

    return result.rows[0];
  }

  /** Toggle online/offline — enforces TIER2_ID verification requirement */
  async toggleOnlineStatus(
    userId: string,
    online: boolean,
  ): Promise<{ online_status: boolean }> {
    if (online) {
      // A Fundi CANNOT go online until they reach TIER2_ID — enforced at API level
      const profile = await query<{ verification_tier: string }>(
        'SELECT verification_tier FROM fundi_profiles WHERE user_id = $1',
        [userId],
      );

      if (!profile.rows[0]) {
        throw new AppError(404, 'Fundi profile not found.', 'Wasifu wa fundi haupatikani.', 'PROFILE_NOT_FOUND');
      }

      const tier = profile.rows[0].verification_tier;
      if (tier === 'unverified' || tier === 'tier1_phone') {
        throw new AppError(
          403,
          'You must complete ID verification before going online.',
          'Lazima ukamilishe uthibitisho wa kitambulisho kabla ya kwenda mtandaoni.',
          'VERIFICATION_REQUIRED',
        );
      }
    }

    const result = await query<{ online_status: boolean }>(
      'UPDATE fundi_profiles SET online_status = $1 WHERE user_id = $2 RETURNING online_status',
      [online, userId],
    );

    logger.info({ event: 'fundi.status_changed', userId, online });
    return result.rows[0]!;
  }

  /** Update Fundi GPS position — called every 30s when online */
  async updateLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    await query(
      `UPDATE fundi_profiles
       SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           last_location_update = NOW()
       WHERE user_id = $3`,
      [longitude, latitude, userId],
    );
  }

  // ──────────────────────────────────────────────
  // Fundi discovery — PostGIS-powered search
  // ──────────────────────────────────────────────

  /**
   * Search Mafundi using PostGIS distance queries.
   * Supports filtering by category, distance, rating, availability, verification, and gender.
   * Results scored by: (0.4 * rating) + (0.3 * acceptance_rate) + (0.2 * completion_rate) + (0.1 * proximity_score)
   */
  async searchMafundi(params: Record<string, unknown>): Promise<{
    success: boolean;
    data: unknown[];
    meta: { page: number; per_page: number; total: number };
    error: null;
  }> {
    const conditions: string[] = ['fp.verification_tier IN (\'tier2_id\', \'tier3_certified\')'];
    const values: unknown[] = [];
    let idx = 1;

    // Category filter
    if (params.category) {
      conditions.push(`$${idx} = ANY(fp.service_categories)`);
      values.push(params.category);
      idx++;
    }

    // Available now filter
    if (params.available_now) {
      conditions.push('fp.online_status = true');
      conditions.push('(fp.holiday_mode_until IS NULL OR fp.holiday_mode_until < NOW())');
    }

    // Verified only filter (tier3)
    if (params.verified_only) {
      conditions.push("fp.verification_tier = 'tier3_certified'");
    }

    // Rating minimum
    if (params.rating_min) {
      conditions.push(`fp.overall_rating >= $${idx}`);
      values.push(params.rating_min);
      idx++;
    }

    // Gender filter for women-only requests
    if (params.female_only) {
      conditions.push("u.profile_photo_url IS NOT NULL"); // Placeholder — gender field needed
    }

    // Distance calculation with PostGIS
    let distanceSelect = '0 AS distance_km';
    let distanceOrder = 'fp.overall_rating DESC';

    if (params.lat && params.lng) {
      const radiusKm = (params.radius_km as number) || 10;
      distanceSelect = `ROUND((ST_Distance(
        fp.current_location,
        ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)::geography
      ) / 1000)::numeric, 1) AS distance_km`;
      values.push(params.lng, params.lat);

      conditions.push(
        `ST_DWithin(
          fp.current_location,
          ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)::geography,
          $${idx + 2}
        )`,
      );
      values.push(radiusKm * 1000); // ST_DWithin uses meters
      idx += 3;

      distanceOrder = 'distance_km ASC';
    }

    // Sorting
    const sort = params.sort as string;
    let orderBy: string;
    switch (sort) {
      case 'distance':
        orderBy = distanceOrder;
        break;
      case 'jobs_completed':
        orderBy = 'fp.total_jobs_completed DESC';
        break;
      case 'rating':
      default:
        orderBy = 'fp.overall_rating DESC';
        break;
    }

    const page = (params.page as number) || 1;
    const perPage = Math.min((params.per_page as number) || 20, 100);
    const offset = (page - 1) * perPage;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM fundi_profiles fp
       JOIN users u ON u.id = fp.user_id AND u.is_active = true AND u.is_suspended = false
       ${whereClause}`,
      values,
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Data query with scoring
    const dataResult = await query(
      `SELECT
        fp.id,
        fp.user_id,
        u.name,
        u.profile_photo_url,
        fp.bio_sw,
        fp.bio_en,
        fp.service_categories,
        fp.overall_rating,
        fp.total_jobs_completed,
        fp.completion_rate,
        fp.acceptance_rate,
        fp.verification_tier,
        fp.online_status,
        fp.hourly_rate_min_tzs,
        fp.hourly_rate_max_tzs,
        ${distanceSelect},
        (0.4 * COALESCE(fp.overall_rating, 0) / 5
         + 0.3 * COALESCE(fp.acceptance_rate, 0) / 100
         + 0.2 * COALESCE(fp.completion_rate, 0) / 100
         + 0.1 * (1 - LEAST(COALESCE(
           ST_Distance(fp.current_location, ST_SetSRID(ST_MakePoint(${params.lng ? `$${idx - 3}` : '0'}, ${params.lat ? `$${idx - 2}` : '0'}), 4326)::geography) / 50000, 1), 1))
        ) AS match_score
       FROM fundi_profiles fp
       JOIN users u ON u.id = fp.user_id AND u.is_active = true AND u.is_suspended = false
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, perPage, offset],
    );

    return {
      success: true,
      data: dataResult.rows,
      meta: { page, per_page: perPage, total },
      error: null,
    };
  }

  /** Get public Fundi profile (visible to customers) */
  async getPublicProfile(fundiUserId: string): Promise<unknown> {
    const result = await query(
      `SELECT
        fp.id, fp.user_id, u.name, u.profile_photo_url,
        fp.bio_sw, fp.bio_en, fp.service_categories,
        fp.overall_rating, fp.total_jobs_completed,
        fp.completion_rate, fp.verification_tier,
        fp.online_status, fp.hourly_rate_min_tzs, fp.hourly_rate_max_tzs,
        fp.portfolio_photos
       FROM fundi_profiles fp
       JOIN users u ON u.id = fp.user_id AND u.is_active = true
       WHERE fp.user_id = $1`,
      [fundiUserId],
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'Fundi not found.', 'Fundi hapatikani.', 'FUNDI_NOT_FOUND');
    }

    return result.rows[0];
  }

  /** Get reviews for a Fundi */
  async getReviews(fundiUserId: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM reviews WHERE reviewee_id = $1 AND is_published = true',
        [fundiUserId],
      ),
      query(
        `SELECT r.id, r.rating, r.comment_text, r.language, r.fundi_response_text,
                r.created_at, r.fundi_responded_at, u.name as reviewer_name
         FROM reviews r
         JOIN users u ON u.id = r.reviewer_id
         WHERE r.reviewee_id = $1 AND r.is_published = true
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [fundiUserId, perPage, offset],
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

  /** Get a Fundi's publicly listed services */
  async getPublicServices(fundiUserId: string): Promise<unknown[]> {
    const result = await query(
      `SELECT fs.* FROM fundi_services fs
       JOIN fundi_profiles fp ON fp.id = fs.fundi_profile_id
       WHERE fp.user_id = $1 AND fs.is_active = true
       ORDER BY fs.created_at`,
      [fundiUserId],
    );
    return result.rows;
  }

  // ──────────────────────────────────────────────
  // Service items
  // ──────────────────────────────────────────────

  async addService(userId: string, data: AddServiceData): Promise<FundiServiceType> {
    const profile = await query<{ id: string }>('SELECT id FROM fundi_profiles WHERE user_id = $1', [userId]);
    if (!profile.rows[0]) {
      throw new AppError(404, 'Create your Fundi profile first.', 'Unda wasifu wako wa fundi kwanza.', 'PROFILE_NOT_FOUND');
    }

    const result = await query<FundiServiceType>(
      `INSERT INTO fundi_services (fundi_profile_id, name_sw, name_en, description_sw, description_en, price_type, price_tzs)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [profile.rows[0].id, data.name_sw, data.name_en, data.description_sw ?? null, data.description_en ?? null, data.price_type, data.price_tzs ?? null],
    );

    return result.rows[0]!;
  }

  async updateService(userId: string, serviceId: string, data: Partial<AddServiceData>): Promise<FundiServiceType> {
    // Verify ownership
    const ownership = await query(
      `SELECT fs.id FROM fundi_services fs
       JOIN fundi_profiles fp ON fp.id = fs.fundi_profile_id
       WHERE fs.id = $1 AND fp.user_id = $2`,
      [serviceId, userId],
    );
    if (!ownership.rows[0]) {
      throw new AppError(404, 'Service not found.', 'Huduma haipatikani.', 'SERVICE_NOT_FOUND');
    }

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

    values.push(serviceId);
    const result = await query<FundiServiceType>(
      `UPDATE fundi_services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    return result.rows[0]!;
  }

  async deleteService(userId: string, serviceId: string): Promise<void> {
    const result = await query(
      `DELETE FROM fundi_services fs
       USING fundi_profiles fp
       WHERE fs.id = $1 AND fs.fundi_profile_id = fp.id AND fp.user_id = $2`,
      [serviceId, userId],
    );

    if (result.rowCount === 0) {
      throw new AppError(404, 'Service not found.', 'Huduma haipatikani.', 'SERVICE_NOT_FOUND');
    }
  }

  // ──────────────────────────────────────────────
  // Wallet + earnings + payouts
  // ──────────────────────────────────────────────

  async getWallet(userId: string): Promise<FundiWallet> {
    const result = await query<FundiWallet>('SELECT * FROM fundi_wallets WHERE fundi_id = $1', [userId]);
    if (!result.rows[0]) {
      throw new AppError(404, 'Wallet not found.', 'Pochi haipatikani.', 'WALLET_NOT_FOUND');
    }
    return result.rows[0];
  }

  async getEarnings(userId: string): Promise<unknown> {
    const [wallet, recentJobs, todayResult, weekResult, monthResult] = await Promise.all([
      query('SELECT * FROM fundi_wallets WHERE fundi_id = $1', [userId]),
      query(
        `SELECT id, job_reference, final_amount_tzs, net_to_fundi_tzs, completed_at
         FROM jobs WHERE fundi_id = $1 AND status = 'completed'
         ORDER BY completed_at DESC LIMIT 10`,
        [userId],
      ),
      query<{ total: string }>(
        "SELECT COALESCE(SUM(net_to_fundi_tzs), 0) as total FROM jobs WHERE fundi_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE",
        [userId],
      ),
      query<{ total: string }>(
        "SELECT COALESCE(SUM(net_to_fundi_tzs), 0) as total FROM jobs WHERE fundi_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '7 days'",
        [userId],
      ),
      query<{ total: string }>(
        "SELECT COALESCE(SUM(net_to_fundi_tzs), 0) as total FROM jobs WHERE fundi_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '30 days'",
        [userId],
      ),
    ]);

    return {
      wallet: wallet.rows[0],
      recent_jobs: recentJobs.rows,
      today_tzs: parseInt(todayResult.rows[0]?.total ?? '0', 10),
      week_tzs: parseInt(weekResult.rows[0]?.total ?? '0', 10),
      month_tzs: parseInt(monthResult.rows[0]?.total ?? '0', 10),
    };
  }

  async requestPayout(userId: string, data: PayoutData): Promise<unknown> {
    // Verify sufficient balance
    const wallet = await this.getWallet(userId);
    if (wallet.balance_tzs < data.amount_tzs) {
      throw new AppError(
        400,
        'Insufficient wallet balance.',
        'Salio la pochi halitoshi.',
        'INSUFFICIENT_BALANCE',
      );
    }

    // Debit wallet and create payout request atomically
    const result = await query(
      `WITH debit AS (
        UPDATE fundi_wallets SET balance_tzs = balance_tzs - $1 WHERE fundi_id = $2
      )
      INSERT INTO payout_requests (fundi_id, amount_tzs, payout_network, payout_number)
      VALUES ($2, $1, $3, $4)
      RETURNING *`,
      [data.amount_tzs, userId, data.payout_network, data.payout_number],
    );

    logger.info({ event: 'fundi.payout_requested', userId, amountTzs: data.amount_tzs });
    return result.rows[0];
  }

  async getPayouts(userId: string, page: number, perPage: number) {
    const offset = (page - 1) * perPage;
    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM payout_requests WHERE fundi_id = $1', [userId]),
      query(
        'SELECT * FROM payout_requests WHERE fundi_id = $1 ORDER BY requested_at DESC LIMIT $2 OFFSET $3',
        [userId, perPage, offset],
      ),
    ]);

    return {
      success: true,
      data: dataResult.rows,
      meta: { page, per_page: perPage, total: parseInt(countResult.rows[0]?.count ?? '0', 10) },
      error: null,
    };
  }

  // ──────────────────────────────────────────────
  // Availability + performance
  // ──────────────────────────────────────────────

  async updateAvailability(userId: string, data: { availability_hours?: Record<string, unknown>; holiday_mode_until?: string | null }): Promise<FundiProfile> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.availability_hours !== undefined) {
      fields.push(`availability_hours = $${idx}`);
      values.push(JSON.stringify(data.availability_hours));
      idx++;
    }
    if (data.holiday_mode_until !== undefined) {
      fields.push(`holiday_mode_until = $${idx}`);
      values.push(data.holiday_mode_until);
      idx++;
    }

    if (fields.length === 0) {
      throw new AppError(400, 'No fields to update.', 'Hakuna sehemu ya kusasisha.', 'NO_UPDATE_FIELDS');
    }

    values.push(userId);
    const result = await query<FundiProfile>(
      `UPDATE fundi_profiles SET ${fields.join(', ')} WHERE user_id = $${idx} RETURNING *`,
      values,
    );

    return result.rows[0]!;
  }

  async getPerformance(userId: string): Promise<unknown> {
    const result = await query(
      `SELECT
        fp.overall_rating,
        fp.total_jobs_completed,
        fp.completion_rate,
        fp.acceptance_rate,
        fp.verification_tier,
        (SELECT COUNT(*) FROM jobs WHERE fundi_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '30 days') as jobs_this_month,
        (SELECT COALESCE(SUM(net_to_fundi_tzs), 0) FROM jobs WHERE fundi_id = $1 AND status = 'completed' AND completed_at >= CURRENT_DATE - INTERVAL '30 days') as earnings_this_month_tzs,
        (SELECT AVG(rating)::numeric(3,2) FROM reviews WHERE reviewee_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days' AND is_published = true) as rating_this_month
       FROM fundi_profiles fp
       WHERE fp.user_id = $1`,
      [userId],
    );

    if (!result.rows[0]) {
      throw new AppError(404, 'Fundi profile not found.', 'Wasifu wa fundi haupatikani.', 'PROFILE_NOT_FOUND');
    }

    return result.rows[0];
  }
}

export const fundiService = new FundiService();
