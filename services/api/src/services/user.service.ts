import { query } from '../db/pool.js';
import { redis } from '../db/redis.js';
import { AppError } from '../middleware/error-handler.js';
import type { User } from '@fundi-wangu/shared-types';

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
}

export const userService = new UserService();
