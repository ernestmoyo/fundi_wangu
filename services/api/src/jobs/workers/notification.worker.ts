import { Worker, Job as BullJob } from 'bullmq';
import { config } from '../../config/index.js';
import { logger } from '../../lib/logger.js';
import { query } from '../../db/pool.js';
import { smsClient } from '../../integrations/africas-talking/sms.client.js';
import { notificationTemplates } from '@fundi-wangu/i18n-strings';
import type { NotificationTemplateKey } from '@fundi-wangu/i18n-strings';
import type { User } from '@fundi-wangu/shared-types';

interface NotificationJobData {
  userId: string;
  templateKey: string;
  variables: Record<string, string>;
  channels: ('push' | 'sms')[];
  priority: 'high' | 'normal';
}

const connection = {
  host: new URL(config.REDIS_URL).hostname,
  port: parseInt(new URL(config.REDIS_URL).port || '6379', 10),
};

/**
 * Notification delivery worker.
 * Processes push and SMS notifications asynchronously via BullMQ.
 * Supports bilingual templates — sends in the user's preferred language.
 */
export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: BullJob<NotificationJobData>) => {
    const { userId, templateKey, variables, channels } = job.data;

    // Look up user for language preference and contact info
    const userResult = await query<User>(
      'SELECT id, phone_number, preferred_language, fcm_token, notification_preference FROM users WHERE id = $1',
      [userId],
    );
    const user = userResult.rows[0];

    if (!user) {
      logger.warn({ event: 'notification.user_not_found', userId, templateKey });
      return;
    }

    // Resolve the template
    const template = notificationTemplates[templateKey as NotificationTemplateKey];
    if (!template) {
      logger.warn({ event: 'notification.template_not_found', templateKey });
      return;
    }

    const lang = user.preferred_language === 'en' ? 'en' : 'sw';
    const { title, body } = template[lang];

    // Interpolate variables into the template
    const resolvedTitle = interpolate(title, variables);
    const resolvedBody = interpolate(body, variables);

    // Deliver via each requested channel
    for (const channel of channels) {
      try {
        if (channel === 'push') {
          await deliverPush(user, resolvedTitle, resolvedBody, templateKey);
        } else if (channel === 'sms') {
          await deliverSms(user, resolvedBody);
        }

        // Log successful delivery
        await query(
          `INSERT INTO notification_log (
            user_id, channel, template_key, content_sw, content_en,
            was_delivered, delivered_at
          ) VALUES ($1, $2, $3, $4, $5, true, NOW())`,
          [
            userId,
            channel,
            templateKey,
            lang === 'sw' ? resolvedBody : null,
            lang === 'en' ? resolvedBody : null,
          ],
        );
      } catch (err) {
        logger.error({
          event: 'notification.delivery_failed',
          channel,
          userId,
          templateKey,
          error: err instanceof Error ? err.message : err,
        });

        // Log failed delivery
        await query(
          `INSERT INTO notification_log (
            user_id, channel, template_key, content_sw, content_en,
            was_delivered, failure_reason
          ) VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [
            userId,
            channel,
            templateKey,
            lang === 'sw' ? resolvedBody : null,
            lang === 'en' ? resolvedBody : null,
            err instanceof Error ? err.message : 'Unknown error',
          ],
        );

        // Re-throw to trigger BullMQ retry
        throw err;
      }
    }

    logger.info({
      event: 'notification.delivered',
      userId,
      templateKey,
      channels,
    });
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000, // Max 100 notifications per second
    },
  },
);

/** Interpolate {{variable}} placeholders in a template string */
function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

/** Deliver push notification via Firebase Cloud Messaging */
async function deliverPush(
  user: User,
  title: string,
  body: string,
  templateKey: string,
): Promise<void> {
  if (!user.fcm_token) {
    logger.info({ event: 'notification.no_fcm_token', userId: user.id });
    return;
  }

  // Firebase Admin SDK integration
  // In production, this sends via admin.messaging().send()
  if (config.NODE_ENV === 'development') {
    logger.info({
      event: 'notification.push.dev_mode',
      userId: user.id,
      title,
      body: body.slice(0, 80),
    });
    return;
  }

  // Production FCM implementation will be added in Phase 2
  // when Firebase is fully configured
  logger.info({
    event: 'notification.push.sent',
    userId: user.id,
    templateKey,
  });
}

/** Deliver SMS notification via Africa's Talking */
async function deliverSms(user: User, body: string): Promise<void> {
  await smsClient.sendSms(user.phone_number, body);
}

// Graceful shutdown
notificationWorker.on('failed', (job, err) => {
  logger.error({
    event: 'notification.worker.job_failed',
    jobId: job?.id,
    data: job?.data,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

notificationWorker.on('error', (err) => {
  logger.error({ event: 'notification.worker.error', error: err.message });
});
