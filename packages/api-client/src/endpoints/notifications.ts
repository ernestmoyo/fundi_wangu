import type { FundiWanguClient } from '../client.js';
import type { NotificationLog } from '@fundi-wangu/shared-types';

export function createNotificationEndpoints(client: FundiWanguClient) {
  return {
    /** Update notification preferences */
    updatePreferences(preference: 'push' | 'sms' | 'both') {
      return client.patch<{ notification_preference: string }>('/api/v1/notifications/preferences', {
        notification_preference: preference,
      });
    },

    /** Register FCM token */
    registerFcmToken(fcmToken: string, deviceInfo?: string) {
      return client.post<null>('/api/v1/notifications/fcm-token', {
        fcm_token: fcmToken,
        device_info: deviceInfo,
      });
    },

    /** Get notification history */
    getHistory(page?: number, perPage?: number) {
      return client.get<NotificationLog[]>('/api/v1/notifications/history', {
        page,
        per_page: perPage,
      });
    },
  };
}
