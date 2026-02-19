-- Up Migration: Fundi withdrawal requests to mobile money

CREATE TABLE payout_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fundi_id        UUID NOT NULL REFERENCES users(id),
    amount_tzs      INTEGER NOT NULL CHECK (amount_tzs >= 5000),
    payout_network  payout_network NOT NULL,
    payout_number   VARCHAR(20) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    gateway_reference VARCHAR(200),
    failure_reason  TEXT,
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);

CREATE INDEX idx_payout_fundi ON payout_requests(fundi_id);
CREATE INDEX idx_payout_status ON payout_requests(status);

-- Down Migration
-- DROP TABLE IF EXISTS payout_requests;
