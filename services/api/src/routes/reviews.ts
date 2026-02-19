import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { reviewService } from '../services/review.service.js';
import { requireRole } from '../middleware/auth.js';

export const reviewsRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const createReviewSchema = z.object({
  job_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment_text: z.string().max(1000).optional(),
  language: z.enum(['sw', 'en']).optional(),
  tip_tzs: z.number().int().min(0).optional(),
});

const respondSchema = z.object({
  response_text: z.string().min(1).max(500),
});

const flagSchema = z.object({
  reason: z.string().min(5).max(500),
});

// ──────────────────────────────────────────────
// Customer review endpoints
// ──────────────────────────────────────────────

/** POST /api/v1/reviews — Submit a review for a completed job */
reviewsRouter.post(
  '/',
  requireRole('customer'),
  validate(createReviewSchema),
  async (req, res, next) => {
    try {
      const review = await reviewService.createReview(req.user!.id, req.body);
      res.status(201).json({ success: true, data: review, meta: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

/** GET /api/v1/reviews/my — Get reviews written by the current user */
reviewsRouter.get('/my', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const reviews = await reviewService.getUserReviews(req.user!.id, page, perPage);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/reviews/:id — Get a specific review */
reviewsRouter.get('/:id', async (req, res, next) => {
  try {
    const review = await reviewService.getReview(req.params.id!);
    res.json({ success: true, data: review, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Fundi response endpoints
// ──────────────────────────────────────────────

/** POST /api/v1/reviews/:id/respond — Fundi responds to a review */
reviewsRouter.post(
  '/:id/respond',
  requireRole('fundi'),
  validate(respondSchema),
  async (req, res, next) => {
    try {
      const review = await reviewService.respondToReview(
        req.user!.id,
        req.params.id!,
        req.body.response_text,
      );
      res.json({ success: true, data: review, meta: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

/** POST /api/v1/reviews/:id/flag — Flag a review for moderation */
reviewsRouter.post(
  '/:id/flag',
  requireRole('fundi'),
  validate(flagSchema),
  async (req, res, next) => {
    try {
      await reviewService.flagReview(req.params.id!, req.user!.id, req.body.reason);
      res.json({
        success: true,
        data: {
          message_en: 'Review flagged for moderation.',
          message_sw: 'Tathmini imeripotiwa kwa ukaguzi.',
        },
        meta: null,
        error: null,
      });
    } catch (err) {
      next(err);
    }
  },
);
