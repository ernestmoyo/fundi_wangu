import type {
  JobStatus,
  PaymentMethod,
  PreferredLanguage,
  UserRole,
} from './enums.js';

/** Standard API response envelope — every endpoint returns this shape */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: PaginationMeta | null;
  error: ApiError | null;
}

/** Bilingual error returned by the API */
export interface ApiError {
  code: string;
  message_en: string;
  message_sw: string;
  status: number;
}

/** Offset-based pagination metadata */
export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

/** Cursor-based pagination for feeds */
export interface CursorPaginationMeta {
  cursor: string | null;
  has_more: boolean;
}

// ──────────────────────────────────────────────
// Auth Payloads
// ──────────────────────────────────────────────

export interface RequestOtpPayload {
  phone_number: string;
}

export interface VerifyOtpPayload {
  phone_number: string;
  code: string;
  name?: string;
  role?: UserRole;
  preferred_language?: PreferredLanguage;
}

export interface RefreshTokenPayload {
  refresh_token: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// ──────────────────────────────────────────────
// Job Payloads
// ──────────────────────────────────────────────

export interface CreateJobPayload {
  category: string;
  service_items: { fundi_service_id: string; quantity: number }[];
  description_text: string;
  description_photos?: string[];
  latitude: number;
  longitude: number;
  address_text: string;
  address_district?: string;
  address_ward?: string;
  scheduled_at?: string;
  payment_method: PaymentMethod;
  is_womens_filter?: boolean;
}

export interface UpdateJobStatusPayload {
  status: JobStatus;
  notes?: string;
  photos?: string[];
  cancellation_reason?: string;
}

export interface ScopeChangePayload {
  additional_amount_tzs: number;
  reason: string;
}

// ──────────────────────────────────────────────
// Payment Payloads
// ──────────────────────────────────────────────

export interface InitiatePaymentPayload {
  job_id: string;
  payment_method: PaymentMethod;
  phone_number: string;
}

export interface TipPayload {
  amount_tzs: number;
  payment_method: PaymentMethod;
  phone_number?: string;
}

// ──────────────────────────────────────────────
// Review Payloads
// ──────────────────────────────────────────────

export interface CreateReviewPayload {
  job_id: string;
  rating: number;
  comment_text?: string;
  language?: PreferredLanguage;
  tip_tzs?: number;
}

export interface FundiReviewResponsePayload {
  response_text: string;
}

// ──────────────────────────────────────────────
// Dispute Payloads
// ──────────────────────────────────────────────

export interface RaiseDisputePayload {
  job_id: string;
  statement: string;
  evidence?: string[];
}

// ──────────────────────────────────────────────
// Search / Discovery
// ──────────────────────────────────────────────

export interface FundiSearchParams {
  category?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  rating_min?: number;
  available_now?: boolean;
  verified_only?: boolean;
  female_only?: boolean;
  sort?: 'distance' | 'rating' | 'jobs_completed';
  page?: number;
  per_page?: number;
}

// ──────────────────────────────────────────────
// User Payloads
// ──────────────────────────────────────────────

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  preferred_language?: PreferredLanguage;
  profile_photo_url?: string;
}

export interface CreateFundiProfilePayload {
  bio_sw?: string;
  bio_en?: string;
  service_categories: string[];
  service_radius_km?: number;
  hourly_rate_min_tzs?: number;
  hourly_rate_max_tzs?: number;
  payout_wallet_number: string;
  payout_network: string;
}

export interface SaveLocationPayload {
  label: string;
  address_text: string;
  latitude: number;
  longitude: number;
  is_default?: boolean;
}

// ──────────────────────────────────────────────
// Business Payloads
// ──────────────────────────────────────────────

export interface CreateBusinessPayload {
  business_name: string;
  tin_number?: string;
  brela_number?: string;
  billing_email?: string;
  billing_address?: string;
}

export interface AddBusinessMemberPayload {
  phone_number: string;
  role: 'manager' | 'member';
}

export interface AddBusinessPropertyPayload {
  name: string;
  address_text: string;
  latitude?: number;
  longitude?: number;
}

// ──────────────────────────────────────────────
// Payout Payloads
// ──────────────────────────────────────────────

export interface RequestPayoutPayload {
  amount_tzs: number;
  payout_network: string;
  payout_number: string;
}

// ──────────────────────────────────────────────
// Notification Payloads
// ──────────────────────────────────────────────

export interface UpdateNotificationPreferencesPayload {
  notification_preference: 'push' | 'sms' | 'both';
}

export interface RegisterFcmTokenPayload {
  fcm_token: string;
  device_info?: string;
}
