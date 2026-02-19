import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { disputeService } from '../services/dispute.service.js';

export const disputesRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const raiseDisputeSchema = z.object({
  job_id: z.string().uuid(),
  statement: z.string().min(10).max(2000),
  evidence: z.array(z.string().url()).max(10).optional(),
});

const submitEvidenceSchema = z.object({
  statement: z.string().min(1).max(2000).optional(),
  evidence: z.array(z.string().url()).max(10).optional(),
});

// ──────────────────────────────────────────────
// Dispute endpoints
// ──────────────────────────────────────────────

/** POST /api/v1/disputes — Raise a dispute */
disputesRouter.post('/', validate(raiseDisputeSchema), async (req, res, next) => {
  try {
    const dispute = await disputeService.raiseDispute(req.user!.id, req.user!.role, req.body);
    res.status(201).json({ success: true, data: dispute, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/disputes — List user's disputes */
disputesRouter.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const result = await disputeService.listDisputes(req.user!.id, page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/disputes/:id — Get dispute details */
disputesRouter.get('/:id', async (req, res, next) => {
  try {
    const dispute = await disputeService.getDispute(req.params.id!, req.user!.id);
    res.json({ success: true, data: dispute, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/disputes/:id — Submit evidence/statement */
disputesRouter.patch('/:id', validate(submitEvidenceSchema), async (req, res, next) => {
  try {
    const dispute = await disputeService.submitEvidence(req.user!.id, req.params.id!, req.body);
    res.json({ success: true, data: dispute, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/disputes/job/:jobId — Get dispute for a specific job */
disputesRouter.get('/job/:jobId', async (req, res, next) => {
  try {
    const dispute = await disputeService.getDisputeByJob(req.params.jobId!, req.user!.id);
    res.json({ success: true, data: dispute, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
