import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { redis } from '../db/redis.js';
import { query } from '../db/pool.js';
import { AppError } from './error-handler.js';
import type { User } from '@fundi-wangu/shared-types';

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      jwtPayload?: JwtPayload;
    }
  }
}

/** Verify JWT access token, check revocation, and attach user to request */
export async function verifyToken(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(
        401,
        'Authentication required. Please sign in.',
        'Uthibitisho unahitajika. Tafadhali ingia.',
        'AUTH_REQUIRED',
      );
    }

    const token = authHeader.slice(7);

    // Verify JWT signature and expiry
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(
          401,
          'Your session has expired. Please sign in again.',
          'Kipindi chako kimeisha. Tafadhali ingia tena.',
          'TOKEN_EXPIRED',
        );
      }
      throw new AppError(
        401,
        'Invalid authentication token.',
        'Tokeni ya uthibitisho si sahihi.',
        'TOKEN_INVALID',
      );
    }

    // Check if token has been revoked
    const isRevoked = await redis.sismember(`revoked_tokens:${payload.sub}`, token);
    if (isRevoked) {
      throw new AppError(
        401,
        'Your session has been revoked. Please sign in again.',
        'Kipindi chako kimefutwa. Tafadhali ingia tena.',
        'TOKEN_REVOKED',
      );
    }

    // Load user — check Redis cache first (TTL 60s)
    const cacheKey = `user:${payload.sub}`;
    let user: User | null = null;

    const cached = await redis.get(cacheKey);
    if (cached) {
      user = JSON.parse(cached) as User;
    } else {
      const result = await query<User>('SELECT * FROM users WHERE id = $1 AND is_active = true', [
        payload.sub,
      ]);
      user = result.rows[0] ?? null;

      if (user) {
        await redis.set(cacheKey, JSON.stringify(user), 'EX', 60);
      }
    }

    if (!user) {
      throw new AppError(
        401,
        'User account not found or deactivated.',
        'Akaunti ya mtumiaji haipatikani au imezimwa.',
        'USER_NOT_FOUND',
      );
    }

    if (user.is_suspended) {
      throw new AppError(
        403,
        'Your account has been suspended. Contact support for assistance.',
        'Akaunti yako imesimamishwa. Wasiliana na msaada kwa usaidizi.',
        'ACCOUNT_SUSPENDED',
      );
    }

    req.user = user;
    req.jwtPayload = payload;
    next();
  } catch (err) {
    next(err);
  }
}

/** Require specific user role(s) */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new AppError(
          401,
          'Authentication required.',
          'Uthibitisho unahitajika.',
          'AUTH_REQUIRED',
        ),
      );
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          'You do not have permission to access this resource.',
          'Huna idhini ya kufikia rasilimali hii.',
          'INSUFFICIENT_ROLE',
        ),
      );
      return;
    }

    next();
  };
}

/** Ensure user can only access their own resources */
export function requireSelf(paramName: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new AppError(
          401,
          'Authentication required.',
          'Uthibitisho unahitajika.',
          'AUTH_REQUIRED',
        ),
      );
      return;
    }

    const paramId = req.params[paramName];
    if (paramId !== req.user.id && req.user.role !== 'admin') {
      next(
        new AppError(
          403,
          'You can only access your own resources.',
          'Unaweza kufikia rasilimali zako tu.',
          'ACCESS_DENIED',
        ),
      );
      return;
    }

    next();
  };
}
