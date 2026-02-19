/** All user roles on the platform */
export const UserRole = {
  CUSTOMER: 'customer',
  FUNDI: 'fundi',
  BUSINESS: 'business',
  AGENT: 'agent',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Supported UI/notification languages */
export const PreferredLanguage = {
  SWAHILI: 'sw',
  ENGLISH: 'en',
} as const;
export type PreferredLanguage = (typeof PreferredLanguage)[keyof typeof PreferredLanguage];

/** Fundi identity verification progression */
export const VerificationTier = {
  UNVERIFIED: 'unverified',
  TIER1_PHONE: 'tier1_phone',
  TIER2_ID: 'tier2_id',
  TIER3_CERTIFIED: 'tier3_certified',
} as const;
export type VerificationTier = (typeof VerificationTier)[keyof typeof VerificationTier];

/** Job lifecycle states */
export const JobStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

/** Supported payment methods in Tanzania */
export const PaymentMethod = {
  MPESA: 'mpesa',
  TIGO_PESA: 'tigo_pesa',
  AIRTEL_MONEY: 'airtel_money',
  HALOPESA: 'halopesa',
  CARD: 'card',
  CASH: 'cash',
  WALLET: 'wallet',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** Payment processing states */
export const PaymentStatus = {
  INITIATED: 'initiated',
  PROCESSING: 'processing',
  HELD_ESCROW: 'held_escrow',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/** Direction of fund movement */
export const PaymentDirection = {
  CUSTOMER_TO_ESCROW: 'customer_to_escrow',
  ESCROW_TO_FUNDI: 'escrow_to_fundi',
  PLATFORM_FEE: 'platform_fee',
  TIP: 'tip',
  REFUND: 'refund',
} as const;
export type PaymentDirection = (typeof PaymentDirection)[keyof typeof PaymentDirection];

/** Notification delivery channels */
export const NotificationChannel = {
  PUSH: 'push',
  SMS: 'sms',
  BOTH: 'both',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

/** Dispute resolution states */
export const DisputeStatus = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED_CUSTOMER: 'resolved_customer',
  RESOLVED_FUNDI: 'resolved_fundi',
  ESCALATED: 'escalated',
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

/** Mobile money networks for Fundi payouts */
export const PayoutNetwork = {
  MPESA: 'mpesa',
  TIGO_PESA: 'tigo_pesa',
  AIRTEL_MONEY: 'airtel_money',
  HALOPESA: 'halopesa',
  BANK: 'bank',
} as const;
export type PayoutNetwork = (typeof PayoutNetwork)[keyof typeof PayoutNetwork];

/** Service pricing models */
export const PriceType = {
  FIXED: 'fixed',
  HOURLY: 'hourly',
  NEGOTIABLE: 'negotiable',
} as const;
export type PriceType = (typeof PriceType)[keyof typeof PriceType];

/** Business account member roles */
export const BusinessMemberRole = {
  OWNER: 'owner',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const;
export type BusinessMemberRole = (typeof BusinessMemberRole)[keyof typeof BusinessMemberRole];

/** Payout processing states */
export const PayoutStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];
