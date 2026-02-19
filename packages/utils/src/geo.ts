/**
 * Geospatial utilities for distance calculations.
 * Used client-side for display; server-side uses PostGIS for precision.
 */

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance between two geographic points in kilometres */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Check if a point falls within a given radius of a centre point */
export function isWithinRadius(
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
): boolean {
  return distanceKm(pointLat, pointLng, centerLat, centerLng) <= radiusKm;
}

/** Format distance for user-facing display: 0.5 → "500m", 2.3 → "2.3km" */
export function formatDistance(km: number, language: 'sw' | 'en'): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters}m`;
  }
  const rounded = Math.round(km * 10) / 10;
  return language === 'sw' ? `km ${rounded}` : `${rounded}km`;
}
