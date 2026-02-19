-- Up Migration: Individual service items a Fundi offers

CREATE TABLE fundi_services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fundi_profile_id UUID NOT NULL REFERENCES fundi_profiles(id) ON DELETE CASCADE,
    name_sw         VARCHAR(200) NOT NULL,
    name_en         VARCHAR(200) NOT NULL,
    description_sw  TEXT,
    description_en  TEXT,
    price_type      VARCHAR(20) NOT NULL CHECK (price_type IN ('fixed', 'hourly', 'negotiable')),
    price_tzs       INTEGER,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fundi_services_profile ON fundi_services(fundi_profile_id);

-- Down Migration
-- DROP TABLE IF EXISTS fundi_services;
