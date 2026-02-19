import { Router } from 'express';
import { pool } from '../db/pool.js';
import { redis } from '../db/redis.js';

export const healthRouter = Router();

const startedAt = new Date().toISOString();
let requestCount = 0;

/** GET /health — Liveness check (used by Docker/load balancer) */
healthRouter.get('/', async (_req, res) => {
  requestCount++;
  const checks: Record<string, string> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime().toFixed(0) + 's',
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

/** GET /health/ready — Readiness check (Kubernetes/Docker) */
healthRouter.get('/ready', async (_req, res) => {
  try {
    const [dbResult, redisResult] = await Promise.allSettled([
      pool.query('SELECT 1'),
      redis.ping(),
    ]);

    const dbReady = dbResult.status === 'fulfilled';
    const redisReady = redisResult.status === 'fulfilled';
    const ready = dbReady && redisReady;

    res.status(ready ? 200 : 503).json({
      success: ready,
      data: { db: dbReady, redis: redisReady },
      meta: null,
      error: ready ? null : { message_en: 'Not all dependencies are ready', message_sw: 'Huduma zote hazijatayari' },
    });
  } catch {
    res.status(503).json({
      success: false,
      data: null,
      meta: null,
      error: { message_en: 'Health check failed', message_sw: 'Ukaguzi wa afya umeshindwa' },
    });
  }
});

/** GET /health/metrics — Basic metrics for monitoring */
healthRouter.get('/metrics', async (_req, res) => {
  const memUsage = process.memoryUsage();

  res.json({
    success: true,
    data: {
      started_at: startedAt,
      uptime_seconds: Math.floor(process.uptime()),
      request_count: requestCount,
      memory: {
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        external_mb: Math.round(memUsage.external / 1024 / 1024),
      },
      node_version: process.version,
      env: process.env.NODE_ENV ?? 'development',
    },
    meta: null,
    error: null,
  });
});
