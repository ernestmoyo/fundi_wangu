import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middleware/error-handler.js';
import { isValidTanzaniaPhone, toE164 } from '@fundi-wangu/utils';

export const authRouter = Router();

const requestOtpSchema = z.object({
  phone_number: z.string().refine(isValidTanzaniaPhone, {
    message: 'Invalid Tanzania phone number',
  }),
});

const verifyOtpSchema = z.object({
  phone_number: z.string().refine(isValidTanzaniaPhone, {
    message: 'Invalid Tanzania phone number',
  }),
  code: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['customer', 'fundi', 'business']).optional(),
  preferred_language: z.enum(['sw', 'en']).optional(),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

/** POST /api/v1/auth/request-otp — Request OTP for login or registration */
authRouter.post('/request-otp', validate(requestOtpSchema), async (req, res, next) => {
  try {
    const phone = toE164(req.body.phone_number as string);
    await authService.requestOtp(phone, req.ip ?? 'unknown');

    res.json({
      success: true,
      data: { message_en: 'OTP sent', message_sw: 'Nambari ya uthibitishaji imetumwa' },
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/auth/verify-otp — Verify OTP and receive tokens */
authRouter.post('/verify-otp', validate(verifyOtpSchema), async (req, res, next) => {
  try {
    const phone = toE164(req.body.phone_number as string);
    const { code, name, role, preferred_language } = req.body as {
      code: string;
      name?: string;
      role?: string;
      preferred_language?: string;
    };

    const tokens = await authService.verifyOtp(phone, code, {
      name,
      role,
      preferred_language,
      ip: req.ip ?? 'unknown',
      deviceInfo: req.headers['user-agent'] ?? undefined,
    });

    res.json({
      success: true,
      data: tokens,
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/auth/refresh — Refresh access token */
authRouter.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refresh_token } = req.body as { refresh_token: string };
    const tokens = await authService.refreshToken(refresh_token);

    res.json({
      success: true,
      data: tokens,
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/auth/logout — Revoke current refresh token */
authRouter.post('/logout', verifyToken, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader!.slice(7);

    await authService.revokeToken(req.user!.id, accessToken);

    res.json({
      success: true,
      data: { message_en: 'Logged out', message_sw: 'Umetoka' },
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/auth/logout-all — Revoke all sessions (security) */
authRouter.post('/logout-all', verifyToken, async (req, res, next) => {
  try {
    await authService.revokeAllTokens(req.user!.id);

    res.json({
      success: true,
      data: {
        message_en: 'All sessions revoked',
        message_sw: 'Vipindi vyote vimefutwa',
      },
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});
