import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { adminService } from '../services/admin.service.js';

export const adminRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const verifyUserSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

const suspendUserSchema = z.object({
  action: z.enum(['suspend', 'unsuspend']),
  reason: z.string().max(500).optional(),
});

const resolveDisputeSchema = z.object({
  resolution: z.enum(['refund_customer', 'release_to_fundi', 'split', 'escalate']),
  resolution_notes: z.string().min(5).max(2000),
  resolution_amount_customer_tzs: z.number().int().min(0).optional(),
  resolution_amount_fundi_tzs: z.number().int().min(0).optional(),
});

const updateConfigSchema = z.object({
  value: z.string().min(1).max(1000),
});

// ──────────────────────────────────────────────
// Live operations
// ──────────────────────────────────────────────

/** GET /api/v1/admin/jobs/live — Real-time active job data */
adminRouter.get('/jobs/live', async (req, res, next) => {
  try {
    const jobs = await adminService.getLiveJobs({
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
      district: req.query.district as string | undefined,
    });
    res.json({ success: true, data: jobs, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Fundi verification
// ──────────────────────────────────────────────

/** GET /api/v1/admin/verification-queue — Pending NIN reviews */
adminRouter.get('/verification-queue', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const result = await adminService.getVerificationQueue(page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/admin/users/:id/verify — Approve or reject verification */
adminRouter.patch('/users/:id/verify', validate(verifyUserSchema), async (req, res, next) => {
  try {
    const profile = await adminService.verifyUser(
      req.user!.id,
      req.params.id!,
      req.body.action,
      req.body.reason,
    );
    res.json({ success: true, data: profile, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/admin/users/:id/suspend — Suspend or unsuspend a user */
adminRouter.patch('/users/:id/suspend', validate(suspendUserSchema), async (req, res, next) => {
  try {
    const user = await adminService.suspendUser(
      req.user!.id,
      req.params.id!,
      req.body.action,
      req.body.reason,
    );
    res.json({ success: true, data: user, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Disputes
// ──────────────────────────────────────────────

/** GET /api/v1/admin/disputes — List all disputes */
adminRouter.get('/disputes', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const status = req.query.status as string | undefined;
    const result = await adminService.listAllDisputes(page, perPage, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/admin/disputes/:id/resolve — Resolve dispute with fund movement */
adminRouter.patch('/disputes/:id/resolve', validate(resolveDisputeSchema), async (req, res, next) => {
  try {
    const dispute = await adminService.resolveDispute(req.user!.id, req.params.id!, req.body);
    res.json({ success: true, data: dispute, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Finance
// ──────────────────────────────────────────────

/** GET /api/v1/admin/finance/dashboard — Revenue and GMV metrics */
adminRouter.get('/finance/dashboard', async (req, res, next) => {
  try {
    const period = req.query.period as string | undefined;
    const dashboard = await adminService.getFinanceDashboard(period);
    res.json({ success: true, data: dashboard, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/admin/finance/payouts — Pending payout queue */
adminRouter.get('/finance/payouts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const result = await adminService.getPayoutQueue(page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/admin/finance/payouts/:id/process — Process a payout */
adminRouter.post('/finance/payouts/:id/process', async (req, res, next) => {
  try {
    const payout = await adminService.processPayout(req.user!.id, req.params.id!);
    res.json({ success: true, data: payout, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────

/** GET /api/v1/admin/analytics/categories — Category performance */
adminRouter.get('/analytics/categories', async (req, res, next) => {
  try {
    const analytics = await adminService.getCategoryAnalytics();
    res.json({ success: true, data: analytics, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/admin/health — Platform health metrics */
adminRouter.get('/health', async (req, res, next) => {
  try {
    const metrics = await adminService.getHealthMetrics();
    res.json({ success: true, data: metrics, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Platform config
// ──────────────────────────────────────────────

/** GET /api/v1/admin/config — List all config entries */
adminRouter.get('/config', async (req, res, next) => {
  try {
    const configs = await adminService.listConfig();
    res.json({ success: true, data: configs, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/admin/config/:key — Update a config value */
adminRouter.patch('/config/:key', validate(updateConfigSchema), async (req, res, next) => {
  try {
    const config = await adminService.updateConfig(req.user!.id, req.params.key!, req.body.value);
    res.json({ success: true, data: config, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
