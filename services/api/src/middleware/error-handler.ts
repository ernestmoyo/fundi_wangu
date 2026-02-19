import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger.js';

/** Bilingual application error with machine-readable code */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public messageEn: string,
    public messageSw: string,
    public code: string,
  ) {
    super(messageEn);
    this.name = 'AppError';
  }
}

/** Centralized error handler — catches all unhandled errors */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Known application errors
  if (err instanceof AppError) {
    logger.warn({
      event: 'app_error',
      code: err.code,
      status: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: err.code,
        message_en: err.messageEn,
        message_sw: err.messageSw,
        status: err.statusCode,
      },
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      data: null,
      meta: null,
      error: {
        code: 'VALIDATION_ERROR',
        message_en: 'Please check the information you provided.',
        message_sw: 'Tafadhali angalia taarifa ulizojaza.',
        status: 400,
        fields: fieldErrors,
      },
    });
    return;
  }

  // Unexpected errors — log full details, return generic message
  logger.error({
    event: 'unhandled_error',
    err,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    data: null,
    meta: null,
    error: {
      code: 'INTERNAL_ERROR',
      message_en: 'An unexpected error occurred. Please try again later.',
      message_sw: 'Hitilafu isiyotarajiwa imetokea. Tafadhali jaribu tena baadaye.',
      status: 500,
    },
  });
}
