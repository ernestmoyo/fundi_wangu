import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { businessService } from '../services/business.service.js';

export const businessRouter = Router();

// ──────────────────────────────────────────────
// Validation schemas
// ──────────────────────────────────────────────

const createAccountSchema = z.object({
  business_name: z.string().min(2).max(200),
  tin_number: z.string().max(50).optional(),
  brela_number: z.string().max(50).optional(),
  billing_email: z.string().email().optional(),
  billing_address: z.string().max(500).optional(),
});

const updateAccountSchema = createAccountSchema.partial();

const addMemberSchema = z.object({
  phone_number: z.string().min(10).max(20),
  role: z.enum(['manager', 'member']),
});

const addPropertySchema = z.object({
  name: z.string().min(2).max(200),
  address_text: z.string().min(3).max(500),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const addWhitelistSchema = z.object({
  fundi_id: z.string().uuid(),
  property_id: z.string().uuid().optional(),
});

// ──────────────────────────────────────────────
// Account management
// ──────────────────────────────────────────────

/** POST /api/v1/business — Create business account */
businessRouter.post('/', validate(createAccountSchema), async (req, res, next) => {
  try {
    const account = await businessService.createAccount(req.user!.id, req.body);
    res.status(201).json({ success: true, data: account, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/business — Get business profile */
businessRouter.get('/', async (req, res, next) => {
  try {
    const account = await businessService.getAccount(req.user!.id);
    res.json({ success: true, data: account, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/business — Update business details */
businessRouter.patch('/', validate(updateAccountSchema), async (req, res, next) => {
  try {
    const account = await businessService.updateAccount(req.user!.id, req.body);
    res.json({ success: true, data: account, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Team members
// ──────────────────────────────────────────────

/** GET /api/v1/business/members — List team members */
businessRouter.get('/members', async (req, res, next) => {
  try {
    const members = await businessService.listMembers(req.user!.id);
    res.json({ success: true, data: members, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/business/members — Add team member */
businessRouter.post('/members', validate(addMemberSchema), async (req, res, next) => {
  try {
    const member = await businessService.addMember(req.user!.id, req.body);
    res.status(201).json({ success: true, data: member, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/business/members/:id — Remove team member */
businessRouter.delete('/members/:id', async (req, res, next) => {
  try {
    await businessService.removeMember(req.user!.id, req.params.id!);
    res.json({ success: true, data: null, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Properties
// ──────────────────────────────────────────────

/** GET /api/v1/business/properties — List properties */
businessRouter.get('/properties', async (req, res, next) => {
  try {
    const properties = await businessService.listProperties(req.user!.id);
    res.json({ success: true, data: properties, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/business/properties — Register property */
businessRouter.post('/properties', validate(addPropertySchema), async (req, res, next) => {
  try {
    const property = await businessService.addProperty(req.user!.id, req.body);
    res.status(201).json({ success: true, data: property, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Fundi whitelist
// ──────────────────────────────────────────────

/** GET /api/v1/business/whitelist — List whitelisted Mafundi */
businessRouter.get('/whitelist', async (req, res, next) => {
  try {
    const whitelist = await businessService.listWhitelist(req.user!.id);
    res.json({ success: true, data: whitelist, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/business/whitelist — Add Fundi to whitelist */
businessRouter.post('/whitelist', validate(addWhitelistSchema), async (req, res, next) => {
  try {
    const entry = await businessService.addToWhitelist(
      req.user!.id,
      req.body.fundi_id,
      req.body.property_id,
    );
    res.status(201).json({ success: true, data: entry, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/business/whitelist/:fundiId — Remove Fundi from whitelist */
businessRouter.delete('/whitelist/:fundiId', async (req, res, next) => {
  try {
    await businessService.removeFromWhitelist(req.user!.id, req.params.fundiId!);
    res.json({ success: true, data: null, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Jobs + Analytics
// ──────────────────────────────────────────────

/** GET /api/v1/business/jobs — All jobs across the business */
businessRouter.get('/jobs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const result = await businessService.listBusinessJobs(req.user!.id, page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/business/analytics — Usage statistics */
businessRouter.get('/analytics', async (req, res, next) => {
  try {
    const analytics = await businessService.getAnalytics(req.user!.id);
    res.json({ success: true, data: analytics, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});
