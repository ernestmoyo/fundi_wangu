import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { userService } from '../services/user.service.js';

export const meRouter = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  preferred_language: z.enum(['sw', 'en']).optional(),
  profile_photo_url: z.string().url().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().min(2).max(100),
  phone_number: z.string().min(10).max(20),
  relationship: z.string().min(2).max(50),
});

/** GET /api/v1/me — Get own profile */
meRouter.get('/', async (req, res, next) => {
  try {
    const user = await userService.findById(req.user!.id);
    res.json({ success: true, data: user, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/v1/me — Update own profile */
meRouter.patch('/', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const updated = await userService.updateUser(req.user!.id, req.body);
    res.json({ success: true, data: updated, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/v1/me — Request account deletion (PDPA compliance) */
meRouter.delete('/', async (req, res, next) => {
  try {
    await userService.deactivateUser(req.user!.id);
    res.json({
      success: true,
      data: {
        message_en: 'Account deletion request received. Your data will be removed within 30 days.',
        message_sw: 'Ombi la kufuta akaunti limepokelewa. Data yako itafutwa ndani ya siku 30.',
      },
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/me/data-export — Download all personal data (PDPA) */
meRouter.get('/data-export', async (req, res, next) => {
  try {
    const data = await userService.exportUserData(req.user!.id);
    res.json({ success: true, data, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/me/emergency-contact — Set emergency contact */
meRouter.post('/emergency-contact', validate(emergencyContactSchema), async (req, res, next) => {
  try {
    await userService.setEmergencyContact(req.user!.id, req.body);
    res.json({
      success: true,
      data: {
        message_en: 'Emergency contact saved.',
        message_sw: 'Mtu wa dharura amehifadhiwa.',
      },
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});
