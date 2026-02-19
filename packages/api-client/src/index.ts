import { FundiWanguClient } from './client.js';
import type { ClientConfig } from './client.js';
import { createAuthEndpoints } from './endpoints/auth.js';
import { createUserEndpoints } from './endpoints/users.js';
import { createJobEndpoints } from './endpoints/jobs.js';
import { createMafundiEndpoints } from './endpoints/mafundi.js';
import { createPaymentEndpoints } from './endpoints/payments.js';
import { createFundiEndpoints } from './endpoints/fundi.js';
import { createReviewEndpoints } from './endpoints/reviews.js';
import { createDisputeEndpoints } from './endpoints/disputes.js';
import { createLocationEndpoints } from './endpoints/locations.js';
import { createNotificationEndpoints } from './endpoints/notifications.js';

export { FundiWanguClient, ApiClientError } from './client.js';
export type { ClientConfig } from './client.js';

/** Create a fully typed Fundi Wangu API client */
export function createApiClient(config: ClientConfig) {
  const client = new FundiWanguClient(config);

  return {
    auth: createAuthEndpoints(client),
    users: createUserEndpoints(client),
    jobs: createJobEndpoints(client),
    mafundi: createMafundiEndpoints(client),
    payments: createPaymentEndpoints(client),
    fundi: createFundiEndpoints(client),
    reviews: createReviewEndpoints(client),
    disputes: createDisputeEndpoints(client),
    locations: createLocationEndpoints(client),
    notifications: createNotificationEndpoints(client),
    /** Access the raw client for custom requests */
    _client: client,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
