import type { FundiWanguClient } from '../client.js';
import type {
  FundiProfile,
  FundiService,
  FundiWallet,
  PayoutRequest,
  CreateFundiProfilePayload,
} from '@fundi-wangu/shared-types';

export function createFundiEndpoints(client: FundiWanguClient) {
  return {
    /** Create Fundi profile (onboarding) */
    createProfile(data: CreateFundiProfilePayload) {
      return client.post<FundiProfile>('/api/v1/fundi/profile', data);
    },

    /** Update Fundi profile */
    updateProfile(data: Partial<CreateFundiProfilePayload>) {
      return client.patch<FundiProfile>('/api/v1/fundi/profile', data);
    },

    /** Get online status */
    getStatus() {
      return client.get<{ online_status: boolean; current_location: unknown }>('/api/v1/fundi/status');
    },

    /** Toggle online/offline */
    toggleStatus(online: boolean) {
      return client.patch<{ online_status: boolean }>('/api/v1/fundi/status', { online });
    },

    /** Update GPS location */
    updateLocation(latitude: number, longitude: number) {
      return client.patch<null>('/api/v1/fundi/location', { latitude, longitude });
    },

    /** Add a service */
    addService(data: {
      name_sw: string;
      name_en: string;
      description_sw?: string;
      description_en?: string;
      price_type: string;
      price_tzs?: number;
    }) {
      return client.post<FundiService>('/api/v1/fundi/services', data);
    },

    /** Update a service */
    updateService(serviceId: string, data: Partial<{ name_sw: string; name_en: string; price_type: string; price_tzs: number }>) {
      return client.patch<FundiService>(`/api/v1/fundi/services/${serviceId}`, data);
    },

    /** Delete a service */
    deleteService(serviceId: string) {
      return client.delete<null>(`/api/v1/fundi/services/${serviceId}`);
    },

    /** Get wallet balance */
    getWallet() {
      return client.get<FundiWallet>('/api/v1/fundi/wallet');
    },

    /** Get earnings summary */
    getEarnings() {
      return client.get<{
        today_tzs: number;
        this_week_tzs: number;
        this_month_tzs: number;
        total_tzs: number;
      }>('/api/v1/fundi/earnings');
    },

    /** Request payout */
    requestPayout(data: { amount_tzs: number; payout_network: string; payout_number: string }) {
      return client.post<PayoutRequest>('/api/v1/fundi/payout', data);
    },

    /** Get payout history */
    getPayouts(page?: number, perPage?: number) {
      return client.get<PayoutRequest[]>('/api/v1/fundi/payouts', { page, per_page: perPage });
    },

    /** Update availability hours */
    updateAvailability(data: {
      availability_hours?: Record<string, { open: string; close: string }>;
      holiday_mode_until?: string | null;
    }) {
      return client.patch<FundiProfile>('/api/v1/fundi/availability', data);
    },

    /** Get performance KPIs */
    getPerformance() {
      return client.get<{
        overall_rating: number;
        acceptance_rate: number;
        completion_rate: number;
        total_jobs_completed: number;
        jobs_last_30_days: number;
      }>('/api/v1/fundi/performance');
    },
  };
}
