import { query } from '../db/pool.js';
import { redis } from '../db/redis.js';
import { logger } from '../lib/logger.js';
import type { NotificationLog } from '@fundi-wangu/shared-types';

class NotificationService {
  /** Update user notification preference (push, sms, or both) */
  async updatePreferences(userId: string, preference: string): Promise<void> {
    await query(
      'UPDATE users SET notification_preference = $1 WHERE id = $2',
      [preference, userId],
    );

    // Invalidate user cache
    await redis.del(`user:${userId}`);

    logger.info({
      event: 'notification.preferences_updated',
      userId,
      preference,
    });
  }

  /** Register or update FCM push token for a user's device */
  async registerFcmToken(userId: string, fcmToken: string, deviceInfo?: string): Promise<void> {
    await query(
      'UPDATE users SET fcm_token = $1 WHERE id = $2',
      [fcmToken, userId],
    );

    // Invalidate user cache
    await redis.del(`user:${userId}`);

    logger.info({
      event: 'notification.fcm_token_registered',
      userId,
      deviceInfo: deviceInfo ?? 'unknown',
    });
  }

  /** Get notification history for a user */
  async getHistory(userId: string, page: number = 1, perPage: number = 20) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM notification_log WHERE user_id = $1',
        [userId],
      ),
      query<NotificationLog>(
        `SELECT * FROM notification_log
         WHERE user_id = $1
         ORDER BY created_at DESC
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

export const notificationService = new NotificationService();
