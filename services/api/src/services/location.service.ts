import { query } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import type { SavedLocation } from '@fundi-wangu/shared-types';

class LocationService {
  /** List all saved locations for a user */
  async listLocations(userId: string): Promise<SavedLocation[]> {
    const result = await query<SavedLocation>(
      `SELECT id, user_id, label, address_text,
              ST_Y(location::geometry) as latitude,
              ST_X(location::geometry) as longitude,
              is_default, created_at
       FROM saved_locations
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  /** Save a new location */
  async createLocation(
    userId: string,
    data: {
      label: string;
      address_text: string;
      latitude: number;
      longitude: number;
      is_default?: boolean;
    },
  ): Promise<SavedLocation> {
    // If setting as default, unset all existing defaults
    if (data.is_default) {
      await query(
        'UPDATE saved_locations SET is_default = false WHERE user_id = $1 AND is_default = true',
        [userId],
      );
    }

    const result = await query<SavedLocation>(
      `INSERT INTO saved_locations (user_id, label, address_text, location, is_default)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, $6)
       RETURNING id, user_id, label, address_text,
                 ST_Y(location::geometry) as latitude,
                 ST_X(location::geometry) as longitude,
                 is_default, created_at`,
      [
        userId,
        data.label,
        data.address_text,
        data.longitude,
        data.latitude,
        data.is_default ?? false,
      ],
    );

    logger.info({
      event: 'location.saved',
      userId,
      label: data.label,
      locationId: result.rows[0]!.id,
    });

    return result.rows[0]!;
  }

  /** Delete a saved location */
  async deleteLocation(userId: string, locationId: string): Promise<void> {
    const result = await query(
      'DELETE FROM saved_locations WHERE id = $1 AND user_id = $2',
      [locationId, userId],
    );

    if (result.rowCount === 0) {
      throw new AppError(
        404,
        'Saved location not found.',
        'Eneo lililohifadhiwa halipatikani.',
        'LOCATION_NOT_FOUND',
      );
    }

    logger.info({ event: 'location.deleted', userId, locationId });
  }
}

export const locationService = new LocationService();
