-- Up Migration: Create all custom enum types

CREATE TYPE user_role AS ENUM ('customer', 'fundi', 'business', 'agent', 'admin');
CREATE TYPE preferred_language AS ENUM ('sw', 'en');
CREATE TYPE verification_tier AS ENUM ('unverified', 'tier1_phone', 'tier2_id', 'tier3_certified');
CREATE TYPE job_status AS ENUM ('pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE payment_method AS ENUM ('mpesa', 'tigo_pesa', 'airtel_money', 'halopesa', 'card', 'cash', 'wallet');
CREATE TYPE payment_status AS ENUM ('initiated', 'processing', 'held_escrow', 'released', 'refunded', 'failed');
CREATE TYPE payment_direction AS ENUM ('customer_to_escrow', 'escrow_to_fundi', 'platform_fee', 'tip', 'refund');
CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'both');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved_customer', 'resolved_fundi', 'escalated');
CREATE TYPE payout_network AS ENUM ('mpesa', 'tigo_pesa', 'airtel_money', 'halopesa', 'bank');

-- Down Migration
-- DROP TYPE IF EXISTS payout_network;
-- DROP TYPE IF EXISTS dispute_status;
-- DROP TYPE IF EXISTS notification_channel;
-- DROP TYPE IF EXISTS payment_direction;
-- DROP TYPE IF EXISTS payment_status;
-- DROP TYPE IF EXISTS payment_method;
-- DROP TYPE IF EXISTS job_status;
-- DROP TYPE IF EXISTS verification_tier;
-- DROP TYPE IF EXISTS preferred_language;
-- DROP TYPE IF EXISTS user_role;
