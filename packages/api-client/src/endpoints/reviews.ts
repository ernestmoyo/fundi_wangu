import type { FundiWanguClient } from '../client.js';
import type { Review, CreateReviewPayload, FundiReviewResponsePayload } from '@fundi-wangu/shared-types';

export function createReviewEndpoints(client: FundiWanguClient) {
  return {
    /** Submit a review */
    create(data: CreateReviewPayload) {
      return client.post<Review>('/api/v1/reviews', data);
    },

    /** Get reviews written by the current user */
    getMyReviews(page?: number, perPage?: number) {
      return client.get<Review[]>('/api/v1/reviews/my', { page, per_page: perPage });
    },

    /** Get a specific review */
    get(reviewId: string) {
      return client.get<Review>(`/api/v1/reviews/${reviewId}`);
    },

    /** Fundi responds to a review */
    respond(reviewId: string, data: FundiReviewResponsePayload) {
      return client.post<Review>(`/api/v1/reviews/${reviewId}/respond`, data);
    },

    /** Flag a review for moderation */
    flag(reviewId: string, reason: string) {
      return client.post<null>(`/api/v1/reviews/${reviewId}/flag`, { reason });
    },
  };
}
