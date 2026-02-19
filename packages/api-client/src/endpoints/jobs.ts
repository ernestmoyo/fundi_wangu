import type { FundiWanguClient } from '../client.js';
import type { Job, CreateJobPayload, UpdateJobStatusPayload, ApiResponse, PaginationMeta } from '@fundi-wangu/shared-types';

export function createJobEndpoints(client: FundiWanguClient) {
  return {
    /** Create a new job */
    create(data: CreateJobPayload) {
      return client.post<Job>('/api/v1/jobs', data);
    },

    /** List jobs for the authenticated user */
    list(params?: { status?: string; page?: number; per_page?: number }) {
      return client.get<Job[]>('/api/v1/jobs', params as Record<string, string | number>);
    },

    /** Get a specific job */
    get(jobId: string) {
      return client.get<Job>(`/api/v1/jobs/${jobId}`);
    },

    /** Update job status */
    updateStatus(jobId: string, data: UpdateJobStatusPayload) {
      return client.patch<Job>(`/api/v1/jobs/${jobId}/status`, data);
    },

    /** Request scope change (fundi only) */
    requestScopeChange(jobId: string, data: { additional_amount_tzs: number; reason: string }) {
      return client.post<Job>(`/api/v1/jobs/${jobId}/scope-change`, data);
    },

    /** Approve scope change (customer only) */
    approveScopeChange(jobId: string) {
      return client.post<Job>(`/api/v1/jobs/${jobId}/scope-change/approve`);
    },
  };
}
