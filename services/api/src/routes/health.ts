import { Router } from 'express';
import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';

export const healthRouter = Router();

/** GET /api/v1/health — Platform health check */
healthRouter.get('/', async (_req, res) => {
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: 'disconnected',
    redis: 'disconnected',
  };

  try {
    await pool.query('SELECT 1');
    checks.db = 'connected';
  } catch {
    checks.status = 'degraded';
  }

  try {
    await redis.ping();
    checks.redis = 'connected';
  } catch {
    checks.status = 'degraded';
  }

  const httpStatus = checks.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json({
    success: checks.status === 'ok',
    data: checks,
    meta: null,
    error: null,
  });
});
