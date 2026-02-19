import type { FundiWanguClient } from '../client.js';
import type { SavedLocation, SaveLocationPayload } from '@fundi-wangu/shared-types';

export function createLocationEndpoints(client: FundiWanguClient) {
  return {
    /** List saved locations */
    list() {
      return client.get<SavedLocation[]>('/api/v1/locations');
    },

    /** Save a new location */
    create(data: SaveLocationPayload) {
      return client.post<SavedLocation>('/api/v1/locations', data);
    },

    /** Delete a saved location */
    remove(locationId: string) {
      return client.delete<null>(`/api/v1/locations/${locationId}`);
    },
  };
}
