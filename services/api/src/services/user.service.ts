import { query } from '../db/pool.js';
import { redis } from '../db/redis.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import type { User } from '@fundi-wangu/shared-types';

interface EmergencyContact {
  name: string;
  phone_number: string;
  relationship: string;
}

class UserService {
  async findById(id: string): Promise<User | null> {
    // Check cache first
    const cached = await redis.get(`user:${id}`);
    if (cached) return JSON.parse(cached) as User;

    const result = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0] ?? null;

    if (user) {
      await redis.set(`user:${id}`, JSON.stringify(user), 'EX', 60);
    }

    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const result = await query<User>('SELECT * FROM users WHERE phone_number = $1', [phone]);
    return result.rows[0] ?? null;
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'preferred_language' | 'profile_photo_url'>>,
  ): Promise<User> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new AppError(400, 'No fields to update.', 'Hakuna sehemu ya kusasisha.', 'NO_UPDATE_FIELDS');
    }

    values.push(id);
    const result = await query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError(404, 'User not found.', 'Mtumiaji hapatikani.', 'USER_NOT_FOUND');
    }

    // Invalidate cache
    await redis.del(`user:${id}`);

    return user;
  }

  /** Soft-delete user account (PDPA compliance — marks inactive, data purged by scheduled job) */
  async deactivateUser(id: string): Promise<void> {
    await query('UPDATE users SET is_active = false WHERE id = $1', [id]);
    await redis.del(`user:${id}`);

    logger.info({ event: 'user.deactivated', userId: id });
  }

  /** Export all personal data for PDPA compliance */
  async exportUserData(id: string): Promise<Record<string, unknown>> {
    const [userResult, jobsResult, reviewsResult, locationsResult] = await Promise.all([
      query('SELECT id, phone_number, name, email, preferred_language, role, created_at FROM users WHERE id = $1', [id]),
      query('SELECT id, job_reference, category, status, quoted_amount_tzs, created_at FROM jobs WHERE customer_id = $1 OR fundi_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT id, rating, comment_text, created_at FROM reviews WHERE reviewer_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT id, label, address_text, created_at FROM saved_locations WHERE user_id = $1', [id]),
    ]);

    return {
      user: userResult.rows[0],
      jobs: jobsResult.rows,
      reviews: reviewsResult.rows,
      saved_locations: locationsResult.rows,
      exported_at: new Date().toISOString(),
    };
  }

  /** Set or update emergency contact */
  async setEmergencyContact(userId: string, contact: EmergencyContact): Promise<void> {
    await query(
      `INSERT INTO emergency_contacts (user_id, name, phone_number, relationship)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, phone_number)
       DO UPDATE SET name = $2, relationship = $4, updated_at = NOW()`,
      [userId, contact.name, contact.phone_number, contact.relationship],
    );

    logger.info({ event: 'user.emergency_contact_set', userId });
  }
}

export const userService = new UserService();
