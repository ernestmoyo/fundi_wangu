-- Up Migration: Fundi professional profiles with PostGIS location

CREATE TABLE fundi_profiles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio_sw                  TEXT,
    bio_en                  TEXT,
    service_categories      TEXT[] NOT NULL DEFAULT '{}',
    work_area_geojson       JSONB,
    service_radius_km       INTEGER NOT NULL DEFAULT 10,
    current_location        GEOGRAPHY(POINT, 4326),
    online_status           BOOLEAN NOT NULL DEFAULT false,
    last_location_update    TIMESTAMPTZ,
    hourly_rate_min_tzs     INTEGER,
    hourly_rate_max_tzs     INTEGER,
    payout_wallet_number    VARCHAR(20),
    payout_network          payout_network,
    overall_rating          NUMERIC(3,2) DEFAULT 0.00,
    total_jobs_completed    INTEGER NOT NULL DEFAULT 0,
    completion_rate         NUMERIC(5,2) DEFAULT 0.00,
    acceptance_rate         NUMERIC(5,2) DEFAULT 0.00,
    verification_tier       verification_tier NOT NULL DEFAULT 'tier1_phone',
    national_id_number      VARCHAR(50),
    national_id_photo_front TEXT,
    national_id_photo_back  TEXT,
    nin_verified_at         TIMESTAMPTZ,
    nin_verified_by         UUID REFERENCES users(id),
    portfolio_photos        TEXT[] DEFAULT '{}',
    availability_hours      JSONB,
    holiday_mode_until      TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fundi_location ON fundi_profiles USING GIST(current_location);
CREATE INDEX idx_fundi_online ON fundi_profiles(online_status) WHERE online_status = true;
CREATE INDEX idx_fundi_categories ON fundi_profiles USING GIN(service_categories);
CREATE INDEX idx_fundi_rating ON fundi_profiles(overall_rating DESC);

-- Down Migration
-- DROP TABLE IF EXISTS fundi_profiles CASCADE;
