import type { Request, Response, NextFunction } from 'express';
import { redis } from '../db/redis.js';
import { AppError } from './error-handler.js';
import { PLATFORM_DEFAULTS } from '@fundi-wangu/shared-types';

/**
 * Redis-backed sliding window rate limiter.
 * Unauthenticated: 60 req/min. Authenticated: 300 req/min.
 */
export async function rateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const isAuthenticated = !!req.user;
    const limit = isAuthenticated
      ? PLATFORM_DEFAULTS.rateLimitAuthPerMin
      : PLATFORM_DEFAULTS.rateLimitUnauthPerMin;

    const identifier = isAuthenticated ? `rl:auth:${req.user!.id}` : `rl:unauth:${req.ip}`;

    const windowMs = 60;
    const current = await redis.incr(identifier);

    if (current === 1) {
      await redis.expire(identifier, windowMs);
    }

    const ttl = await redis.ttl(identifier);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

    if (current > limit) {
      next(
        new AppError(
          429,
          'Too many requests. Please slow down.',
          'Maombi mengi sana. Tafadhali pumzika kidogo.',
          'RATE_LIMIT_EXCEEDED',
        ),
      );
      return;
    }

    next();
  } catch (err) {
    // If Redis is down, allow the request through rather than blocking
    next();
  }
}
