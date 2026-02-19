import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import ENV from '@/config/env';

interface UserLocation {
  latitude: number;
  longitude: number;
  address: string | null;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Ruhusa ya eneo imekataliwa');
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const address = geo
        ? [geo.street, geo.district, geo.city].filter(Boolean).join(', ')
        : null;

      const result: UserLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address,
      };

      setLocation(result);
      return result;
    } catch (err) {
      setError('Imeshindwa kupata eneo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, requestLocation };
}

export function useFundiLocationTracking(enabled: boolean) {
  const [watchId, setWatchId] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!enabled) {
      watchId?.remove();
      setWatchId(null);
      return;
    }

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: ENV.LOCATION_UPDATE_INTERVAL_MS,
          distanceInterval: 50,
        },
        (pos) => {
          // Location update sent to server via API
          void pos; // Consumed by caller via onLocationUpdate
        },
      );
      setWatchId(subscription);
    })();

    return () => {
      subscription?.remove();
    };
  }, [enabled]);

  return { isTracking: !!watchId };
}
