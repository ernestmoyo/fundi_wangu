import type { FundiWanguClient } from '../client.js';
import type { User, UpdateProfilePayload } from '@fundi-wangu/shared-types';

export function createUserEndpoints(client: FundiWanguClient) {
  return {
    /** Get current user profile */
    getMe() {
      return client.get<User>('/api/v1/me');
    },

    /** Update user profile */
    updateProfile(data: UpdateProfilePayload) {
      return client.patch<User>('/api/v1/me', data);
    },

    /** Request account deletion (PDPA) */
    deleteAccount() {
      return client.delete<{ message_en: string; message_sw: string }>('/api/v1/me');
    },

    /** Export all personal data (PDPA) */
    exportData() {
      return client.get<Record<string, unknown>>('/api/v1/me/data-export');
    },

    /** Set emergency contact */
    setEmergencyContact(data: { name: string; phone_number: string; relationship: string }) {
      return client.post<{ message_en: string; message_sw: string }>('/api/v1/me/emergency-contact', data);
    },
  };
}
