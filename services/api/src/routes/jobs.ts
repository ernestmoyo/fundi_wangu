import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { jobService } from '../services/job.service.js';
import { requireRole } from '../middleware/auth.js';

export const jobsRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const createJobSchema = z.object({
  category: z.string().min(1),
  service_items: z
    .array(
      z.object({
        fundi_service_id: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1)
    .max(20),
  description_text: z.string().min(10).max(2000),
  description_photos: z.array(z.string().url()).max(5).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address_text: z.string().min(3).max(500),
  address_district: z.string().max(100).optional(),
  address_ward: z.string().max(100).optional(),
  scheduled_at: z.string().datetime().optional(),
  payment_method: z.enum([
    'mpesa',
    'tigo_pesa',
    'airtel_money',
    'halopesa',
    'card',
    'cash',
    'wallet',
  ]),
  is_womens_filter: z.boolean().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'accepted',
    'en_route',
    'arrived',
    'in_progress',
    'completed',
    'cancelled',
    'disputed',
  ]),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
  cancellation_reason: z.string().max(500).optional(),
});

const scopeChangeSchema = z.object({
  additional_amount_tzs: z.number().int().min(1000),
  reason: z.string().min(5).max(500),
});

// ──────────────────────────────────────────────
// Job CRUD
// ──────────────────────────────────────────────

/** POST /api/v1/jobs — Create a new job (customer only) */
jobsRouter.post('/', requireRole('customer'), validate(createJobSchema), async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user!.id, req.body);
    res.status(201).json({ success: true, data: job, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/jobs — List jobs for the authenticated user */
jobsRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const result = await jobService.listJobs(req.user!.id, req.user!.role, status, page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/jobs/:id — Get a specific job */
jobsRouter.get('/:id', async (req, res, next) => {
  try {
    const job = await jobService.getJob(req.params.id!, req.user!.id);
    res.json({ success: true, data: job, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/jobs/:id/status — Update job status (state machine) */
jobsRouter.patch('/:id/status', validate(updateStatusSchema), async (req, res, next) => {
  try {
    const job = await jobService.updateStatus(
      req.params.id!,
      req.user!.id,
      req.user!.role,
      req.body.status,
      {
        cancellation_reason: req.body.cancellation_reason,
        photos: req.body.photos,
        notes: req.body.notes,
      },
    );
    res.json({ success: true, data: job, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/jobs/:id/assign — Trigger Fundi assignment (internal / automated) */
jobsRouter.post('/:id/assign', async (req, res, next) => {
  try {
    const result = await jobService.assignJob(req.params.id!);
    res.json({ success: true, data: result, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/jobs/:id/scope-change — Request scope change (fundi only) */
jobsRouter.post(
  '/:id/scope-change',
  requireRole('fundi'),
  validate(scopeChangeSchema),
  async (req, res, next) => {
    try {
      const job = await jobService.requestScopeChange(
        req.params.id!,
        req.user!.id,
        req.body.additional_amount_tzs,
        req.body.reason,
      );
      res.json({ success: true, data: job, meta: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

/** POST /api/v1/jobs/:id/scope-change/approve — Approve scope change (customer only) */
jobsRouter.post(
  '/:id/scope-change/approve',
  requireRole('customer'),
  async (req, res, next) => {
    try {
      const job = await jobService.approveScopeChange(req.params.id!, req.user!.id);
      res.json({ success: true, data: job, meta: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);
