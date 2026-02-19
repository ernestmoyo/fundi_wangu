-- Up Migration: Customer saved addresses

CREATE TABLE saved_locations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(100) NOT NULL,
    address_text TEXT NOT NULL,
    location    GEOGRAPHY(POINT, 4326) NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_locations_user ON saved_locations(user_id);

-- Down Migration
-- DROP TABLE IF EXISTS saved_locations;
