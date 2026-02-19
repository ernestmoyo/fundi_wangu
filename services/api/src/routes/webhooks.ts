import { Router } from 'express';
import type { Request } from 'express';
import { paymentService } from '../services/payment.service.js';
import { logger } from '../lib/logger.js';

export const webhooksRouter = Router();

/**
 * POST /api/v1/webhooks/selcom — Selcom payment callback.
 * Uses raw body (preserved by express.json verify callback) for HMAC signature verification.
 * This endpoint is NOT authenticated via JWT — signature verification is the auth mechanism.
 */
webhooksRouter.post('/selcom', async (req, res) => {
  try {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf-8')
      ?? JSON.stringify(req.body);
    const signature = (req.headers['x-selcom-signature'] as string) || '';

    const payload = req.body as {
      order_id: string;
      reference: string;
      result_code: string;
      status: string;
      message: string;
    };

    if (!payload.order_id || !payload.reference) {
      logger.warn({ event: 'webhook.selcom.invalid_payload' });
      res.status(400).json({ success: false, error: 'Invalid payload' });
      return;
    }

    await paymentService.processWebhook(rawBody, signature, payload);

    // Always return 200 to Selcom to prevent retries for processed webhooks
    res.status(200).json({ success: true });
  } catch (err) {
    // Log but still return 200 to prevent infinite retries from the gateway
    logger.error({
      event: 'webhook.selcom.error',
      error: err instanceof Error ? err.message : err,
    });
    res.status(200).json({ success: true });
  }
});
