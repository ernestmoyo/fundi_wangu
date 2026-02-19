import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { categoriesRouter } from './categories.js';

export const router = Router();

// Public endpoints (no auth required)
router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/categories', categoriesRouter);

// Authenticated endpoints will be added in Phase 1:
// router.use('/me', verifyToken, meRouter);
// router.use('/mafundi', mafundiRouter);
// router.use('/fundi', verifyToken, requireRole('fundi'), fundiRouter);
// router.use('/jobs', verifyToken, jobsRouter);
// router.use('/payments', verifyToken, paymentsRouter);
// router.use('/reviews', verifyToken, reviewsRouter);
// router.use('/disputes', verifyToken, disputesRouter);
// router.use('/locations', verifyToken, locationsRouter);
// router.use('/notifications', verifyToken, notificationsRouter);
// router.use('/business', verifyToken, requireRole('business'), businessRouter);
// router.use('/admin', verifyToken, requireRole('admin'), adminRouter);
// router.use('/webhooks', webhooksRouter);
