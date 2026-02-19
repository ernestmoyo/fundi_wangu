import type { FundiWanguClient } from '../client.js';
import type { AuthTokens, User } from '@fundi-wangu/shared-types';

export function createAuthEndpoints(client: FundiWanguClient) {
  return {
    /** Request OTP for phone number */
    requestOtp(phoneNumber: string) {
      return client.post<{ message: string }>('/api/v1/auth/otp/request', {
        phone_number: phoneNumber,
      });
    },

    /** Verify OTP and receive tokens */
    verifyOtp(data: {
      phone_number: string;
      code: string;
      name?: string;
      role?: string;
      preferred_language?: string;
    }) {
      return client.post<AuthTokens & { user: User }>('/api/v1/auth/otp/verify', data);
    },

    /** Refresh access token */
    refreshToken(refreshToken: string) {
      return client.post<AuthTokens>('/api/v1/auth/refresh', {
        refresh_token: refreshToken,
      });
    },

    /** Logout current session */
    logout() {
      return client.post<null>('/api/v1/auth/logout');
    },

    /** Logout all sessions */
    logoutAll() {
      return client.post<null>('/api/v1/auth/logout-all');
    },
  };
}
