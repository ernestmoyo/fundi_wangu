-- Up Migration: Emergency contacts for safety features

CREATE TABLE emergency_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20) NOT NULL,
    relationship    VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);

-- Down Migration
-- DROP TABLE IF EXISTS emergency_contacts CASCADE;
