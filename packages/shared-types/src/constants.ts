import type { JobStatus } from './enums.js';

/** All 14 service categories offered on the platform (bilingual) */
export const SERVICE_CATEGORIES = [
  { key: 'electrician', nameEn: 'Electrician', nameSw: 'Fundi wa Umeme', icon: '⚡' },
  { key: 'plumber', nameEn: 'Plumber', nameSw: 'Fundi wa Mabomba', icon: '🔧' },
  { key: 'ac_technician', nameEn: 'AC Technician', nameSw: 'Fundi wa Kiyoyozi', icon: '❄️' },
  { key: 'mechanic', nameEn: 'Mechanic', nameSw: 'Fundi wa Magari', icon: '🚗' },
  { key: 'cleaning', nameEn: 'Cleaning', nameSw: 'Usafi wa Nyumba', icon: '🧹' },
  { key: 'painter', nameEn: 'Painter', nameSw: 'Mpigaji Rangi', icon: '🎨' },
  { key: 'carpenter', nameEn: 'Carpenter', nameSw: 'Seremala', icon: '🪵' },
  { key: 'mason', nameEn: 'Mason / Builder', nameSw: 'Mjenzi', icon: '🏗️' },
  { key: 'welder', nameEn: 'Welder', nameSw: 'Mchomaji Chuma', icon: '🔥' },
  { key: 'tutor', nameEn: 'Tutor', nameSw: 'Mwalimu wa Nyumbani', icon: '📚' },
  { key: 'beauty', nameEn: 'Beauty / Hair', nameSw: 'Kinyozi / Msaloni', icon: '✂️' },
  { key: 'domestic_help', nameEn: 'Domestic Help', nameSw: 'Msaidizi wa Nyumbani', icon: '🏠' },
  { key: 'it_support', nameEn: 'IT Support', nameSw: 'Fundi wa Kompyuta', icon: '💻' },
  { key: 'cctv', nameEn: 'CCTV / Security', nameSw: 'Fundi wa Usalama', icon: '📷' },
] as const;

export type ServiceCategoryKey = (typeof SERVICE_CATEGORIES)[number]['key'];

/**
 * Valid state transitions for job lifecycle.
 * Each key maps to the set of states it can transition TO.
 * Enforced at the API level — clients cannot make invalid transitions.
 */
export const JOB_STATUS_TRANSITIONS: Record<JobStatus, readonly JobStatus[]> = {
  pending: ['accepted', 'cancelled'],
  accepted: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'disputed'],
  completed: ['disputed'],
  cancelled: [],
  disputed: [],
} as const;

/** Platform default configuration values */
export const PLATFORM_DEFAULTS = {
  platformFeePercent: 15,
  vatPercent: 18,
  escrowAutoReleaseHours: 24,
  fundiAcceptanceTimeoutSeconds: 90,
  otpExpirySeconds: 300,
  maxOtpAttempts: 5,
  minPayoutTzs: 5000,
  jobProtectionLevyTzs: 500,
  maxPortfolioPhotos: 12,
  maxJobDescriptionPhotos: 5,
  maxCompletionPhotos: 10,
  maxFileUploadMb: 10,
  defaultServiceRadiusKm: 10,
  paginationDefaultPerPage: 20,
  paginationMaxPerPage: 100,
  rateLimitUnauthPerMin: 60,
  rateLimitAuthPerMin: 300,
} as const;
