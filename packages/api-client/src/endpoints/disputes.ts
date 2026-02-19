import type { FundiWanguClient } from '../client.js';
import type { Dispute, RaiseDisputePayload } from '@fundi-wangu/shared-types';

export function createDisputeEndpoints(client: FundiWanguClient) {
  return {
    /** Raise a dispute */
    raise(data: RaiseDisputePayload) {
      return client.post<Dispute>('/api/v1/disputes', data);
    },

    /** List user's disputes */
    list(page?: number, perPage?: number) {
      return client.get<Dispute[]>('/api/v1/disputes', { page, per_page: perPage });
    },

    /** Get dispute details */
    get(disputeId: string) {
      return client.get<Dispute>(`/api/v1/disputes/${disputeId}`);
    },

    /** Submit evidence */
    submitEvidence(disputeId: string, data: { statement?: string; evidence?: string[] }) {
      return client.patch<Dispute>(`/api/v1/disputes/${disputeId}`, data);
    },

    /** Get dispute for a specific job */
    getByJob(jobId: string) {
      return client.get<Dispute | null>(`/api/v1/disputes/job/${jobId}`);
    },
  };
}
