/** Environment configuration for the mobile app */

const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.fundiwangu.co.tz',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? 'wss://api.fundiwangu.co.tz',
  GOOGLE_MAPS_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? '',
  OTP_LENGTH: 6,
  OTP_RESEND_INTERVAL_SEC: 60,
  TOKEN_REFRESH_THRESHOLD_MS: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_IMAGE_SIZE_MB: 5,
  LOCATION_UPDATE_INTERVAL_MS: 30_000, // 30 seconds for Fundi tracking
  DEFAULT_MAP_REGION: {
    latitude: -6.7924,
    longitude: 39.2083,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
  DEFAULT_LANGUAGE: 'sw' as const,
  SUPPORTED_LANGUAGES: ['sw', 'en'] as const,
} as const;

export default ENV;
