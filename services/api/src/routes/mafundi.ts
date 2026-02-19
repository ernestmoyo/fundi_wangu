import { Router } from 'express';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate.js';
import { fundiService } from '../services/fundi.service.js';

export const mafundiRouter = Router();

const searchSchema = z.object({
  category: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().min(1).max(50).default(10),
  rating_min: z.coerce.number().min(0).max(5).optional(),
  available_now: z.coerce.boolean().optional(),
  verified_only: z.coerce.boolean().optional(),
  female_only: z.coerce.boolean().optional(),
  sort: z.enum(['distance', 'rating', 'jobs_completed']).default('rating'),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

/** GET /api/v1/mafundi — Search/list Mafundi with filters and PostGIS distance */
mafundiRouter.get('/', validateQuery(searchSchema), async (req, res, next) => {
  try {
    const result = await fundiService.searchMafundi(req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/mafundi/:id — Fundi public profile */
mafundiRouter.get('/:id', async (req, res, next) => {
  try {
    const profile = await fundiService.getPublicProfile(req.params.id!);
    res.json({ success: true, data: profile, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/mafundi/:id/reviews — Paginated reviews */
mafundiRouter.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const result = await fundiService.getReviews(req.params.id!, page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/mafundi/:id/services — Fundi's service menu */
mafundiRouter.get('/:id/services', async (req, res, next) => {
  try {
    const services = await fundiService.getPublicServices(req.params.id!);
    res.json({ success: true, data: services, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
