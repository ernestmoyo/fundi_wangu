-- Up Migration: Verified professional certifications

CREATE TABLE trade_certifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fundi_profile_id UUID NOT NULL REFERENCES fundi_profiles(id) ON DELETE CASCADE,
    cert_name       VARCHAR(200) NOT NULL,
    issuing_body    VARCHAR(200),
    cert_photo_url  TEXT NOT NULL,
    issued_at       DATE,
    expires_at      DATE,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    verified_at     TIMESTAMPTZ,
    verified_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Down Migration
-- DROP TABLE IF EXISTS trade_certifications;
