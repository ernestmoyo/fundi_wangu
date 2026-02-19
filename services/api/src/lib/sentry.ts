/**
 * Sentry error tracking — only active when SENTRY_DSN is configured.
 * In development, errors are logged locally via pino.
 */

import { config } from '../config/index.js';
import { logger } from './logger.js';

interface SentryLike {
  captureException: (err: Error, context?: Record<string, unknown>) => void;
  captureMessage: (msg: string, level?: string) => void;
}

let sentry: SentryLike | null = null;

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || config.NODE_ENV !== 'production') {
    logger.info('Sentry is disabled (no DSN or non-production environment)');
    return;
  }

  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn,
      environment: config.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Strip sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
    sentry = Sentry;
    logger.info('Sentry initialized for error tracking');
  } catch (err) {
    logger.warn({ err }, 'Failed to initialize Sentry — continuing without error tracking');
  }
}

export function captureError(err: Error, context?: Record<string, unknown>): void {
  if (sentry) {
    sentry.captureException(err, context);
  }
}

export function captureMessage(msg: string, level = 'info'): void {
  if (sentry) {
    sentry.captureMessage(msg, level);
  }
}
