-- Up Migration: Fundi earnings wallet

CREATE TABLE fundi_wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fundi_id        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance_tzs     INTEGER NOT NULL DEFAULT 0,
    pending_tzs     INTEGER NOT NULL DEFAULT 0,
    total_earned_tzs INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Down Migration
-- DROP TABLE IF EXISTS fundi_wallets;
