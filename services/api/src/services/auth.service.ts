import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { redis } from '../db/redis.js';
import { query, getClient } from '../db/pool.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../lib/logger.js';
import { smsClient } from '../integrations/africas-talking/sms.client.js';
import { PLATFORM_DEFAULTS } from '@fundi-wangu/shared-types';
import type { User } from '@fundi-wangu/shared-types';
import { maskPhone } from '@fundi-wangu/utils';

interface VerifyOtpOptions {
  name?: string;
  role?: string;
  preferred_language?: string;
  ip: string;
  deviceInfo?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

class AuthService {
  /**
   * Request OTP for login or registration.
   * Stores OTP in Redis with TTL. Rate-limited per phone number.
   */
  async requestOtp(phone: string, ip: string): Promise<void> {
    // Rate limit: max 3 OTP requests per phone per 5 minutes
    const rateLimitKey = `otp_rate:${phone}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 300);
    }
    if (attempts > 3) {
      throw new AppError(
        429,
        'Too many OTP requests. Please wait 5 minutes.',
        'Maombi mengi ya OTP. Tafadhali subiri dakika 5.',
        'OTP_RATE_LIMITED',
      );
    }

    const otp = generateOtp();
    const otpKey = `otp:${phone}`;

    // Store OTP with expiry and attempt counter
    await redis.setex(otpKey, PLATFORM_DEFAULTS.otpExpirySeconds, otp);
    await redis.setex(`otp_attempts:${phone}`, PLATFORM_DEFAULTS.otpExpirySeconds, '0');

    // Audit log
    await query(
      'INSERT INTO otp_audit_log (phone_number, purpose, ip_address) VALUES ($1, $2, $3)',
      [phone, 'login', ip],
    );

    // Send SMS (async — queued in production)
    await smsClient.sendOtp(phone, otp);

    logger.info({
      event: 'otp.requested',
      phone: maskPhone(phone),
    });
  }

  /**
   * Verify OTP and issue JWT tokens.
   * Creates user account if this is the first login.
   */
  async verifyOtp(phone: string, code: string, options: VerifyOtpOptions): Promise<AuthTokens> {
    const otpKey = `otp:${phone}`;
    const attemptsKey = `otp_attempts:${phone}`;

    // Check attempt count
    const attempts = parseInt((await redis.get(attemptsKey)) ?? '0', 10);
    if (attempts >= PLATFORM_DEFAULTS.maxOtpAttempts) {
      throw new AppError(
        429,
        'Too many verification attempts. Please request a new code.',
        'Majaribio mengi ya uthibitishaji. Tafadhali omba nambari mpya.',
        'OTP_MAX_ATTEMPTS',
      );
    }

    // Verify OTP
    const storedOtp = await redis.get(otpKey);
    if (!storedOtp) {
      throw new AppError(
        410,
        'Your verification code has expired. Please request a new one.',
        'Nambari yako ya uthibitishaji imeisha muda. Tafadhali omba nambari mpya.',
        'OTP_EXPIRED',
      );
    }

    if (storedOtp !== code) {
      await redis.incr(attemptsKey);
      throw new AppError(
        401,
        'Invalid verification code.',
        'Nambari ya uthibitishaji si sahihi.',
        'OTP_INVALID',
      );
    }

    // OTP verified — clean up
    await redis.del(otpKey);
    await redis.del(attemptsKey);

    // Find or create user
    let user: User;
    const existingResult = await query<User>('SELECT * FROM users WHERE phone_number = $1', [
      phone,
    ]);

    if (existingResult.rows[0]) {
      user = existingResult.rows[0];

      // Update phone verification if needed
      if (!user.is_phone_verified) {
        await query('UPDATE users SET is_phone_verified = true WHERE id = $1', [user.id]);
        user.is_phone_verified = true;
      }
    } else {
      // New user registration
      if (!options.name || !options.role) {
        throw new AppError(
          400,
          'Name and role are required for registration.',
          'Jina na aina ya akaunti vinahitajika kwa usajili.',
          'REGISTRATION_INCOMPLETE',
        );
      }

      const result = await query<User>(
        `INSERT INTO users (phone_number, name, role, preferred_language, is_phone_verified)
         VALUES ($1, $2, $3, $4, true)
         RETURNING *`,
        [phone, options.name, options.role, options.preferred_language ?? 'sw'],
      );
      user = result.rows[0]!;

      // Create wallet for fundi
      if (options.role === 'fundi') {
        await query('INSERT INTO fundi_wallets (fundi_id) VALUES ($1)', [user.id]);
      }

      logger.info({
        event: 'user.registered',
        userId: user.id,
        role: user.role,
        phone: maskPhone(phone),
      });
    }

    // Audit success
    await query(
      `UPDATE otp_audit_log SET verified_at = NOW(), was_successful = true
       WHERE phone_number = $1 AND was_successful = false
       ORDER BY requested_at DESC LIMIT 1`,
      [phone],
    );

    // Issue tokens
    const tokens = await this.issueTokens(user, options.deviceInfo);

    logger.info({
      event: 'auth.login',
      userId: user.id,
      phone: maskPhone(phone),
    });

    return { ...tokens, user };
  }

  /** Issue a new access + refresh token pair */
  private async issueTokens(
    user: User,
    deviceInfo?: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const accessToken = jwt.sign(
      { sub: user.id, role: user.role },
      config.JWT_ACCESS_SECRET,
      { expiresIn: config.JWT_ACCESS_EXPIRY },
    );

    const refreshToken = uuidv4();
    const tokenHash = hashToken(refreshToken);

    // Parse JWT_REFRESH_EXPIRY (e.g., "30d") to seconds
    const expiryMatch = config.JWT_REFRESH_EXPIRY.match(/^(\d+)([dhms])$/);
    let expirySeconds = 30 * 24 * 3600; // default 30 days
    if (expiryMatch) {
      const value = parseInt(expiryMatch[1]!, 10);
      const unit = expiryMatch[2];
      switch (unit) {
        case 'd': expirySeconds = value * 86400; break;
        case 'h': expirySeconds = value * 3600; break;
        case 'm': expirySeconds = value * 60; break;
        case 's': expirySeconds = value; break;
      }
    }

    const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString();

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_info, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, deviceInfo ?? null, expiresAt],
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  /** Refresh an expired access token using a valid refresh token */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const tokenHash = hashToken(refreshToken);

    const result = await query<{ user_id: string; device_info: string | null }>(
      `SELECT user_id, device_info FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash],
    );

    if (!result.rows[0]) {
      throw new AppError(
        401,
        'Invalid or expired refresh token. Please sign in again.',
        'Tokeni ya kuonyesha upya si sahihi au imeisha. Tafadhali ingia tena.',
        'REFRESH_TOKEN_INVALID',
      );
    }

    const { user_id, device_info } = result.rows[0];

    // Revoke old refresh token (rotation)
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);

    // Load user
    const userResult = await query<User>('SELECT * FROM users WHERE id = $1 AND is_active = true', [
      user_id,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      throw new AppError(
        401,
        'User account not found.',
        'Akaunti ya mtumiaji haipatikani.',
        'USER_NOT_FOUND',
      );
    }

    return this.issueTokens(user, device_info ?? undefined);
  }

  /** Revoke a specific access token */
  async revokeToken(userId: string, accessToken: string): Promise<void> {
    // Add to Redis revocation set with TTL matching token expiry
    await redis.sadd(`revoked_tokens:${userId}`, accessToken);
    await redis.expire(`revoked_tokens:${userId}`, 900); // 15 min TTL
  }

  /** Revoke all refresh tokens for a user (security: compromised account) */
  async revokeAllTokens(userId: string): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [
      userId,
    ]);

    // Clear user cache
    await redis.del(`user:${userId}`);

    logger.info({ event: 'auth.revoke_all', userId });
  }
}

export const authService = new AuthService();
