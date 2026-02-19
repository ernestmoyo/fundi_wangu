-- Up Migration: Admin-configurable platform settings

CREATE TABLE platform_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID REFERENCES users(id)
);

-- Seed default configuration values
INSERT INTO platform_config (key, value, description) VALUES
    ('platform_fee_percent', '15', 'Platform commission percentage'),
    ('vat_percent', '18', 'Tanzania VAT rate'),
    ('escrow_auto_release_hours', '24', 'Hours before escrow auto-releases after job completion'),
    ('fundi_acceptance_timeout_seconds', '90', 'Seconds for Fundi to accept a job request'),
    ('otp_expiry_seconds', '300', 'OTP validity window in seconds'),
    ('max_otp_attempts', '5', 'Max OTP verification attempts per session'),
    ('min_payout_tzs', '5000', 'Minimum Fundi payout amount in TZS'),
    ('job_protection_levy_tzs', '500', 'Per-booking levy for indemnity fund');

-- Down Migration
-- DROP TABLE IF EXISTS platform_config;
