-- Up Migration: OTP verification audit trail

CREATE TABLE otp_audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number    VARCHAR(20) NOT NULL,
    purpose         VARCHAR(50) NOT NULL,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at     TIMESTAMPTZ,
    ip_address      INET,
    was_successful  BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_otp_audit_phone ON otp_audit_log(phone_number, requested_at DESC);

-- Down Migration
-- DROP TABLE IF EXISTS otp_audit_log;
