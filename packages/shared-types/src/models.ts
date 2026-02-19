import type {
  UserRole,
  PreferredLanguage,
  VerificationTier,
  JobStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentDirection,
  NotificationChannel,
  DisputeStatus,
  PayoutNetwork,
  PriceType,
  BusinessMemberRole,
  PayoutStatus,
} from './enums.js';

/** Base fields present on most database entities */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

/** All platform users — customers, mafundi, agents, admins */
export interface User extends BaseEntity {
  phone_number: string;
  name: string;
  email: string | null;
  preferred_language: PreferredLanguage;
  role: UserRole;
  profile_photo_url: string | null;
  is_active: boolean;
  is_phone_verified: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  fcm_token: string | null;
  notification_preference: NotificationChannel;
  last_active_at: string | null;
}

/** OTP verification audit trail for compliance */
export interface OtpAuditLog {
  id: string;
  phone_number: string;
  purpose: string;
  requested_at: string;
  verified_at: string | null;
  ip_address: string | null;
  was_successful: boolean;
}

/** JWT refresh token storage for revocation support */
export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  device_info: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

/** Geographic coordinate pair */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Fundi-specific professional profile */
export interface FundiProfile extends BaseEntity {
  user_id: string;
  bio_sw: string | null;
  bio_en: string | null;
  service_categories: string[];
  work_area_geojson: Record<string, unknown> | null;
  service_radius_km: number;
  current_location: GeoPoint | null;
  online_status: boolean;
  last_location_update: string | null;
  hourly_rate_min_tzs: number | null;
  hourly_rate_max_tzs: number | null;
  payout_wallet_number: string | null;
  payout_network: PayoutNetwork | null;
  overall_rating: number;
  total_jobs_completed: number;
  completion_rate: number;
  acceptance_rate: number;
  verification_tier: VerificationTier;
  national_id_number: string | null;
  national_id_photo_front: string | null;
  national_id_photo_back: string | null;
  nin_verified_at: string | null;
  nin_verified_by: string | null;
  portfolio_photos: string[];
  availability_hours: Record<string, { open: string; close: string }> | null;
  holiday_mode_until: string | null;
}

/** Individual service a Fundi offers with pricing */
export interface FundiService {
  id: string;
  fundi_profile_id: string;
  name_sw: string;
  name_en: string;
  description_sw: string | null;
  description_en: string | null;
  price_type: PriceType;
  price_tzs: number | null;
  is_active: boolean;
  created_at: string;
}

/** Verified professional certification */
export interface TradeCertification {
  id: string;
  fundi_profile_id: string;
  cert_name: string;
  issuing_body: string | null;
  cert_photo_url: string;
  issued_at: string | null;
  expires_at: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

/** A booking / job between customer and fundi */
export interface Job extends BaseEntity {
  job_reference: string;
  customer_id: string;
  fundi_id: string | null;
  agent_id: string | null;
  category: string;
  service_items: Record<string, unknown>[];
  description_text: string;
  description_photos: string[];
  location: GeoPoint;
  address_text: string;
  address_district: string | null;
  address_ward: string | null;
  scheduled_at: string | null;
  status: JobStatus;
  quoted_amount_tzs: number;
  final_amount_tzs: number | null;
  platform_fee_tzs: number;
  vat_tzs: number;
  net_to_fundi_tzs: number | null;
  payment_method: PaymentMethod;
  completion_photos: string[];
  fundi_notes: string | null;
  is_womens_filter: boolean;
  accepted_at: string | null;
  en_route_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  disputed_at: string | null;
  escrow_release_at: string | null;
}

/** Record of every fund movement on the platform */
export interface PaymentTransaction extends BaseEntity {
  job_id: string;
  idempotency_key: string;
  amount_tzs: number;
  platform_fee_tzs: number;
  vat_tzs: number;
  net_tzs: number;
  payment_method: PaymentMethod;
  direction: PaymentDirection;
  status: PaymentStatus;
  gateway_name: string | null;
  gateway_reference: string | null;
  gateway_raw_response: Record<string, unknown> | null;
  phone_number: string | null;
  failure_reason: string | null;
  retry_count: number;
}

/** Fundi earnings wallet */
export interface FundiWallet {
  id: string;
  fundi_id: string;
  balance_tzs: number;
  pending_tzs: number;
  total_earned_tzs: number;
  updated_at: string;
}

/** Fundi withdrawal request to mobile money */
export interface PayoutRequest {
  id: string;
  fundi_id: string;
  amount_tzs: number;
  payout_network: PayoutNetwork;
  payout_number: string;
  status: PayoutStatus;
  gateway_reference: string | null;
  failure_reason: string | null;
  requested_at: string;
  processed_at: string | null;
}

/** Customer review of a completed job */
export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment_text: string | null;
  language: PreferredLanguage;
  fundi_response_text: string | null;
  fundi_responded_at: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  is_published: boolean;
  tip_tzs: number;
  created_at: string;
}

/** Job dispute raised by either party */
export interface Dispute extends BaseEntity {
  job_id: string;
  raised_by_id: string;
  status: DisputeStatus;
  customer_statement: string | null;
  fundi_statement: string | null;
  customer_evidence: string[];
  fundi_evidence: string[];
  resolution: string | null;
  resolved_by_id: string | null;
  resolved_at: string | null;
  resolution_amount_customer_tzs: number | null;
  resolution_amount_fundi_tzs: number | null;
}

/** In-app message within a job context */
export interface JobMessage {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  is_system: boolean;
  language: PreferredLanguage;
  sent_at: string;
  read_at: string | null;
}

/** Notification delivery record for audit */
export interface NotificationLog {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  template_key: string;
  content_sw: string | null;
  content_en: string | null;
  job_id: string | null;
  was_delivered: boolean | null;
  delivered_at: string | null;
  failure_reason: string | null;
  created_at: string;
}

/** Corporate / property management business account */
export interface BusinessAccount {
  id: string;
  owner_id: string;
  business_name: string;
  tin_number: string | null;
  brela_number: string | null;
  billing_email: string | null;
  billing_address: string | null;
  subscription_type: string;
  created_at: string;
}

/** Team member within a business account */
export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessMemberRole;
  added_at: string;
}

/** Physical property managed by a business account */
export interface BusinessProperty {
  id: string;
  business_id: string;
  name: string;
  address_text: string;
  location: GeoPoint | null;
  created_at: string;
}

/** Preferred fundi whitelist for business accounts */
export interface BusinessFundiWhitelist {
  business_id: string;
  fundi_id: string;
  property_id: string | null;
  added_by_id: string;
  added_at: string;
}

/** Customer saved address */
export interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  address_text: string;
  location: GeoPoint;
  is_default: boolean;
  created_at: string;
}

/** Admin-configurable platform settings */
export interface PlatformConfig {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

/** Immutable audit trail for sensitive operations */
export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
