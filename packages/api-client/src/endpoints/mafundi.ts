import type { FundiWanguClient } from '../client.js';
import type { FundiProfile, FundiService, Review, FundiSearchParams } from '@fundi-wangu/shared-types';

export function createMafundiEndpoints(client: FundiWanguClient) {
  return {
    /** Search and list Mafundi with filters */
    search(params: FundiSearchParams) {
      return client.get<FundiProfile[]>('/api/v1/mafundi', params as Record<string, string | number | boolean>);
    },

    /** Get a Fundi's public profile */
    getProfile(fundiId: string) {
      return client.get<FundiProfile>(`/api/v1/mafundi/${fundiId}`);
    },

    /** Get a Fundi's reviews */
    getReviews(fundiId: string, page?: number, perPage?: number) {
      return client.get<Review[]>(`/api/v1/mafundi/${fundiId}/reviews`, {
        page,
        per_page: perPage,
      });
    },

    /** Get a Fundi's services */
    getServices(fundiId: string) {
      return client.get<FundiService[]>(`/api/v1/mafundi/${fundiId}/services`);
    },
  };
}
