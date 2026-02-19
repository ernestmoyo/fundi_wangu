import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { categoriesRouter } from './categories.js';
import { meRouter } from './me.js';
import { mafundiRouter } from './mafundi.js';
import { fundiRouter } from './fundi.js';
import { jobsRouter } from './jobs.js';
import { paymentsRouter } from './payments.js';
import { reviewsRouter } from './reviews.js';
import { webhooksRouter } from './webhooks.js';
import { disputesRouter } from './disputes.js';
import { locationsRouter } from './locations.js';
import { notificationsRouter } from './notifications.js';
import { businessRouter } from './business.js';
import { adminRouter } from './admin.js';
import { agentRouter } from './agent.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

export const router = Router();

// ──────────────────────────────────────────────
// Public endpoints (no auth required)
// ──────────────────────────────────────────────
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/categories', categoriesRouter);
router.use('/mafundi', mafundiRouter);

// ──────────────────────────────────────────────
// Webhook endpoints (signature-verified, not JWT)
// ──────────────────────────────────────────────
router.use('/webhooks', webhooksRouter);

// ──────────────────────────────────────────────
// Authenticated endpoints
// ──────────────────────────────────────────────
router.use('/me', verifyToken, meRouter);
router.use('/fundi', verifyToken, requireRole('fundi'), fundiRouter);
router.use('/jobs', verifyToken, jobsRouter);
router.use('/payments', verifyToken, paymentsRouter);
router.use('/reviews', verifyToken, reviewsRouter);
router.use('/disputes', verifyToken, disputesRouter);
router.use('/locations', verifyToken, locationsRouter);
router.use('/notifications', verifyToken, notificationsRouter);

// ──────────────────────────────────────────────
// Role-restricted endpoints
// ──────────────────────────────────────────────
router.use('/business', verifyToken, requireRole('business'), businessRouter);
router.use('/agent', verifyToken, requireRole('agent'), agentRouter);
router.use('/admin', verifyToken, requireRole('admin'), adminRouter);
