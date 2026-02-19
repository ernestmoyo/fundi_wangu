import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { agentService } from '../services/agent.service.js';

export const agentRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const createJobForCustomerSchema = z.object({
  customer_phone: z.string().min(10).max(20),
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

const assignFundiSchema = z.object({
  fundi_id: z.string().uuid(),
});

// ──────────────────────────────────────────────
// Agent dispatch endpoints
// ──────────────────────────────────────────────

/** POST /api/v1/agent/jobs — Create a job on behalf of a customer */
agentRouter.post('/jobs', validate(createJobForCustomerSchema), async (req, res, next) => {
  try {
    const { customer_phone, ...jobData } = req.body;
    const job = await agentService.createJobForCustomer(req.user!.id, customer_phone, jobData);
    res.status(201).json({ success: true, data: job, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/agent/jobs — List jobs dispatched by this agent */
agentRouter.get('/jobs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const result = await agentService.listAgentJobs(req.user!.id, page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/agent/jobs/:id/assign — Manually assign a Fundi to a job */
agentRouter.post('/jobs/:id/assign', validate(assignFundiSchema), async (req, res, next) => {
  try {
    const job = await agentService.assignFundi(req.user!.id, req.params.id!, req.body.fundi_id);
    res.json({ success: true, data: job, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/agent/performance — Agent dispatch performance */
agentRouter.get('/performance', async (req, res, next) => {
  try {
    const performance = await agentService.getAgentPerformance(req.user!.id);
    res.json({ success: true, data: performance, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
