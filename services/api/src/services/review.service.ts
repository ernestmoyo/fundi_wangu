import { query } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { enqueueNotification } from '../jobs/queue.js';
import type { Job, Review } from '@fundi-wangu/shared-types';

class ReviewService {
  // ──────────────────────────────────────────────
  // Review submission
  // ──────────────────────────────────────────────

  /**
   * Submit a review for a completed job.
   * Only the customer can review. One review per job.
   * The database trigger (update_fundi_rating) auto-recalculates the Fundi's overall rating.
   */
  async createReview(
    reviewerId: string,
    data: {
      job_id: string;
      rating: number;
      comment_text?: string;
      language?: string;
      tip_tzs?: number;
    },
  ): Promise<Review> {
    // Validate job ownership and status
    const jobResult = await query<Job>(
      `SELECT * FROM jobs WHERE id = $1 AND customer_id = $2 AND status IN ('completed', 'disputed')`,
      [data.job_id, reviewerId],
    );
    const job = jobResult.rows[0];

    if (!job) {
      throw new AppError(
        404,
        'Completed job not found or not your job.',
        'Kazi iliyokamilika haipatikani au si yako.',
        'JOB_NOT_FOUND',
      );
    }

    if (!job.fundi_id) {
      throw new AppError(
        400,
        'No fundi assigned to this job.',
        'Hakuna fundi aliyepangiwa kazi hii.',
        'NO_FUNDI_ASSIGNED',
      );
    }

    // Check for duplicate review
    const existingReview = await query<Review>(
      'SELECT id FROM reviews WHERE job_id = $1 AND reviewer_id = $2',
      [data.job_id, reviewerId],
    );

    if (existingReview.rows.length > 0) {
      throw new AppError(
        409,
        'You have already reviewed this job.',
        'Tayari umetathmini kazi hii.',
        'DUPLICATE_REVIEW',
      );
    }

    // Rating must be 1-5
    if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      throw new AppError(
        400,
        'Rating must be an integer between 1 and 5.',
        'Tathmini lazima iwe kati ya 1 na 5.',
        'INVALID_RATING',
      );
    }

    const result = await query<Review>(
      `INSERT INTO reviews (
        job_id, reviewer_id, reviewee_id, rating, comment_text,
        language, tip_tzs, is_published
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *`,
      [
        data.job_id,
        reviewerId,
        job.fundi_id,
        data.rating,
        data.comment_text ?? null,
        data.language ?? 'sw',
        data.tip_tzs ?? 0,
      ],
    );

    const review = result.rows[0]!;

    // Notify the Fundi about the new review
    await enqueueNotification({
      userId: job.fundi_id,
      templateKey: 'NEW_REVIEW',
      variables: {
        rating: String(data.rating),
        customerName: 'Mteja', // Privacy: don't reveal customer name
      },
      channels: ['push'],
      priority: 'normal',
    });

    logger.info({
      event: 'review.created',
      reviewId: review.id,
      jobId: data.job_id,
      reviewerId,
      revieweeId: job.fundi_id,
      rating: data.rating,
    });

    return review;
  }

  // ──────────────────────────────────────────────
  // Fundi response
  // ──────────────────────────────────────────────

  /**
   * Allow a Fundi to respond to a review.
   * One response per review. Cannot edit after submission.
   */
  async respondToReview(
    fundiId: string,
    reviewId: string,
    responseText: string,
  ): Promise<Review> {
    const reviewResult = await query<Review>(
      'SELECT * FROM reviews WHERE id = $1 AND reviewee_id = $2',
      [reviewId, fundiId],
    );
    const review = reviewResult.rows[0];

    if (!review) {
      throw new AppError(
        404,
        'Review not found or not addressed to you.',
        'Tathmini haipatikani au si yako.',
        'REVIEW_NOT_FOUND',
      );
    }

    if (review.fundi_response_text) {
      throw new AppError(
        409,
        'You have already responded to this review.',
        'Tayari umejibu tathmini hii.',
        'DUPLICATE_RESPONSE',
      );
    }

    const result = await query<Review>(
      `UPDATE reviews
       SET fundi_response_text = $1, fundi_responded_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [responseText, reviewId],
    );

    logger.info({
      event: 'review.fundi_responded',
      reviewId,
      fundiId,
    });

    return result.rows[0]!;
  }

  // ──────────────────────────────────────────────
  // Review queries
  // ──────────────────────────────────────────────

  /** Get reviews for a Fundi (public) */
  async getFundiReviews(
    fundiId: string,
    page: number = 1,
    perPage: number = 20,
  ) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM reviews WHERE reviewee_id = $1 AND is_published = true',
        [fundiId],
      ),
      query<Review>(
        `SELECT r.*, u.name as reviewer_name
         FROM reviews r
         JOIN users u ON u.id = r.reviewer_id
         WHERE r.reviewee_id = $1 AND r.is_published = true
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [fundiId, perPage, offset],
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

  /** Get a specific review */
  async getReview(reviewId: string): Promise<Review> {
    const result = await query<Review>(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId],
    );

    if (!result.rows[0]) {
      throw new AppError(
        404,
        'Review not found.',
        'Tathmini haipatikani.',
        'REVIEW_NOT_FOUND',
      );
    }

    return result.rows[0];
  }

  /** Get all reviews written by a user (for their profile) */
  async getUserReviews(userId: string, page: number = 1, perPage: number = 20) {
    const offset = (page - 1) * perPage;

    const [countResult, dataResult] = await Promise.all([
      query<{ count: string }>(
        'SELECT COUNT(*) as count FROM reviews WHERE reviewer_id = $1',
        [userId],
      ),
      query<Review>(
        `SELECT * FROM reviews WHERE reviewer_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
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

  /** Flag a review for admin moderation */
  async flagReview(reviewId: string, userId: string, reason: string): Promise<void> {
    const result = await query<Review>(
      'SELECT * FROM reviews WHERE id = $1',
      [reviewId],
    );
    const review = result.rows[0];

    if (!review) {
      throw new AppError(404, 'Review not found.', 'Tathmini haipatikani.', 'REVIEW_NOT_FOUND');
    }

    // Only the reviewee (Fundi) or admin can flag
    if (review.reviewee_id !== userId) {
      throw new AppError(
        403,
        'You cannot flag this review.',
        'Huwezi kuripoti tathmini hii.',
        'FORBIDDEN',
      );
    }

    await query(
      'UPDATE reviews SET is_flagged = true, flag_reason = $1 WHERE id = $2',
      [reason, reviewId],
    );

    logger.info({
      event: 'review.flagged',
      reviewId,
      flaggedBy: userId,
      reason,
    });
  }
}

export const reviewService = new ReviewService();
