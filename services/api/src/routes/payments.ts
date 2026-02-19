import { Router, raw } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { paymentService } from '../services/payment.service.js';
import { requireRole } from '../middleware/auth.js';

export const paymentsRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const initiatePaymentSchema = z.object({
  job_id: z.string().uuid(),
  payment_method: z.enum([
    'mpesa',
    'tigo_pesa',
    'airtel_money',
    'halopesa',
    'card',
  ]),
  phone_number: z.string().min(10).max(20),
});

const tipSchema = z.object({
  amount_tzs: z.number().int().min(1000),
  payment_method: z.enum([
    'mpesa',
    'tigo_pesa',
    'airtel_money',
    'halopesa',
    'card',
    'wallet',
  ]),
  phone_number: z.string().min(10).max(20).optional(),
});

// ──────────────────────────────────────────────
// Customer payment endpoints
// ──────────────────────────────────────────────

/** POST /api/v1/payments/initiate — Initiate mobile money payment (USSD push) */
paymentsRouter.post(
  '/initiate',
  requireRole('customer'),
  validate(initiatePaymentSchema),
  async (req, res, next) => {
    try {
      const transaction = await paymentService.initiatePayment(
        req.user!.id,
        req.body.job_id,
        req.body.payment_method,
        req.body.phone_number,
      );
      res.status(201).json({ success: true, data: transaction, meta: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);

/** GET /api/v1/payments/job/:jobId — Get payments for a job */
paymentsRouter.get('/job/:jobId', async (req, res, next) => {
  try {
    const payments = await paymentService.getJobPayments(req.params.jobId!, req.user!.id);
    res.json({ success: true, data: payments, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/payments/:id — Get payment status */
paymentsRouter.get('/:id', async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentStatus(req.params.id!, req.user!.id);
    res.json({ success: true, data: payment, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/payments/job/:jobId/tip — Send a tip to the Fundi */
paymentsRouter.post(
  '/job/:jobId/tip',
  requireRole('customer'),
  validate(tipSchema),
  async (req, res, next) => {
    try {
      const transaction = await paymentService.sendTip(
        req.user!.id,
        req.params.jobId!,
        req.body.amount_tzs,
        req.body.payment_method,
        req.body.phone_number,
      );
      res.status(201).json({ success: true, data: transaction, meta: null, error: null });
    } catch (err) {
      next(err);
    }
  },
);
