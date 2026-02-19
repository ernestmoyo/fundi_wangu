-- Up Migration: Users table — all platform users

CREATE TABLE users (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number            VARCHAR(20) NOT NULL UNIQUE,
    name                    VARCHAR(100) NOT NULL,
    email                   VARCHAR(255),
    preferred_language      preferred_language NOT NULL DEFAULT 'sw',
    role                    user_role NOT NULL,
    profile_photo_url       TEXT,
    is_active               BOOLEAN NOT NULL DEFAULT true,
    is_phone_verified       BOOLEAN NOT NULL DEFAULT false,
    is_suspended            BOOLEAN NOT NULL DEFAULT false,
    suspension_reason       TEXT,
    fcm_token               TEXT,
    notification_preference notification_channel NOT NULL DEFAULT 'both',
    last_active_at          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Down Migration
-- DROP TABLE IF EXISTS users CASCADE;
