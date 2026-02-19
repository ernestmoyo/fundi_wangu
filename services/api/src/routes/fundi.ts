import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { fundiService } from '../services/fundi.service.js';
import { AppError } from '../middleware/error-handler.js';

export const fundiRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const createProfileSchema = z.object({
  bio_sw: z.string().max(500).optional(),
  bio_en: z.string().max(500).optional(),
  service_categories: z.array(z.string()).min(1).max(5),
  service_radius_km: z.number().int().min(1).max(50).optional(),
  hourly_rate_min_tzs: z.number().int().min(0).optional(),
  hourly_rate_max_tzs: z.number().int().min(0).optional(),
  payout_wallet_number: z.string().min(10).max(20),
  payout_network: z.enum(['mpesa', 'tigo_pesa', 'airtel_money', 'halopesa', 'bank']),
});

const updateProfileSchema = createProfileSchema.partial();

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const toggleStatusSchema = z.object({
  online: z.boolean(),
});

const addServiceSchema = z.object({
  name_sw: z.string().min(2).max(200),
  name_en: z.string().min(2).max(200),
  description_sw: z.string().max(500).optional(),
  description_en: z.string().max(500).optional(),
  price_type: z.enum(['fixed', 'hourly', 'negotiable']),
  price_tzs: z.number().int().min(0).optional(),
});

const updateServiceSchema = addServiceSchema.partial();

const availabilitySchema = z.object({
  availability_hours: z.record(
    z.object({ open: z.string(), close: z.string() }),
  ).optional(),
  holiday_mode_until: z.string().datetime().nullable().optional(),
});

const payoutSchema = z.object({
  amount_tzs: z.number().int().min(5000),
  payout_network: z.enum(['mpesa', 'tigo_pesa', 'airtel_money', 'halopesa', 'bank']),
  payout_number: z.string().min(10).max(20),
});

// ──────────────────────────────────────────────
// Profile management
// ──────────────────────────────────────────────

/** POST /api/v1/fundi/profile — Create Fundi profile (onboarding) */
fundiRouter.post('/profile', validate(createProfileSchema), async (req, res, next) => {
  try {
    const profile = await fundiService.createProfile(req.user!.id, req.body);
    res.status(201).json({ success: true, data: profile, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/fundi/profile — Update profile */
fundiRouter.patch('/profile', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const profile = await fundiService.updateProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Online status + location
// ──────────────────────────────────────────────

/** GET /api/v1/fundi/status — Get online status */
fundiRouter.get('/status', async (req, res, next) => {
  try {
    const status = await fundiService.getStatus(req.user!.id);
    res.json({ success: true, data: status, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/fundi/status — Toggle online/offline */
fundiRouter.patch('/status', validate(toggleStatusSchema), async (req, res, next) => {
  try {
    const status = await fundiService.toggleOnlineStatus(req.user!.id, req.body.online);
    res.json({ success: true, data: status, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/fundi/location — Update GPS location (called every 30s when online) */
fundiRouter.patch('/location', validate(updateLocationSchema), async (req, res, next) => {
  try {
    await fundiService.updateLocation(req.user!.id, req.body.latitude, req.body.longitude);
    res.json({ success: true, data: null, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Services management
// ──────────────────────────────────────────────

/** POST /api/v1/fundi/services — Add service item */
fundiRouter.post('/services', validate(addServiceSchema), async (req, res, next) => {
  try {
    const service = await fundiService.addService(req.user!.id, req.body);
    res.status(201).json({ success: true, data: service, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/fundi/services/:id — Update service item */
fundiRouter.patch('/services/:id', validate(updateServiceSchema), async (req, res, next) => {
  try {
    const service = await fundiService.updateService(req.user!.id, req.params.id!, req.body);
    res.json({ success: true, data: service, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/fundi/services/:id — Remove service item */
fundiRouter.delete('/services/:id', async (req, res, next) => {
  try {
    await fundiService.deleteService(req.user!.id, req.params.id!);
    res.json({ success: true, data: null, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Earnings + wallet
// ──────────────────────────────────────────────

/** GET /api/v1/fundi/wallet — Wallet balance */
fundiRouter.get('/wallet', async (req, res, next) => {
  try {
    const wallet = await fundiService.getWallet(req.user!.id);
    res.json({ success: true, data: wallet, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/fundi/earnings — Earnings summary */
fundiRouter.get('/earnings', async (req, res, next) => {
  try {
    const earnings = await fundiService.getEarnings(req.user!.id);
    res.json({ success: true, data: earnings, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/fundi/payout — Request payout */
fundiRouter.post('/payout', validate(payoutSchema), async (req, res, next) => {
  try {
    const payout = await fundiService.requestPayout(req.user!.id, req.body);
    res.status(201).json({ success: true, data: payout, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/fundi/payouts — Payout history */
fundiRouter.get('/payouts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 20;
    const payouts = await fundiService.getPayouts(req.user!.id, page, perPage);
    res.json(payouts);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Availability + performance
// ──────────────────────────────────────────────

/** PATCH /api/v1/fundi/availability — Set availability hours / holiday mode */
fundiRouter.patch('/availability', validate(availabilitySchema), async (req, res, next) => {
  try {
    const profile = await fundiService.updateAvailability(req.user!.id, req.body);
    res.json({ success: true, data: profile, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/fundi/performance — KPI dashboard */
fundiRouter.get('/performance', async (req, res, next) => {
  try {
    const kpis = await fundiService.getPerformance(req.user!.id);
    res.json({ success: true, data: kpis, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
