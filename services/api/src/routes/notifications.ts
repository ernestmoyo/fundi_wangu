import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { notificationService } from '../services/notification.service.js';

export const notificationsRouter = Router();

const updatePreferencesSchema = z.object({
  notification_preference: z.enum(['push', 'sms', 'both']),
});

const registerFcmTokenSchema = z.object({
  fcm_token: z.string().min(10).max(500),
  device_info: z.string().max(200).optional(),
});

/** PATCH /api/v1/notifications/preferences — Update notification preference */
notificationsRouter.patch('/preferences', validate(updatePreferencesSchema), async (req, res, next) => {
  try {
    await notificationService.updatePreferences(req.user!.id, req.body.notification_preference);
    res.json({
      success: true,
      data: {
        notification_preference: req.body.notification_preference,
        message_en: 'Notification preferences updated.',
        message_sw: 'Mapendeleo ya arifa yamebadilishwa.',
      },
      meta: null,
      error: null,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/v1/notifications/fcm-token — Register/update FCM push token */
notificationsRouter.post('/fcm-token', validate(registerFcmTokenSchema), async (req, res, next) => {
  try {
    await notificationService.registerFcmToken(req.user!.id, req.body.fcm_token, req.body.device_info);
    res.json({ success: true, data: null, meta: null, error: null });
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/notifications/history — Notification history for the user */
notificationsRouter.get('/history', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = Math.min(parseInt(req.query.per_page as string) || 20, 100);
    const result = await notificationService.getHistory(req.user!.id, page, perPage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
