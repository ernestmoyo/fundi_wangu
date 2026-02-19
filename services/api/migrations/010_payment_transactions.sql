-- Up Migration: Record of every fund movement on the platform

CREATE TABLE payment_transactions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id              UUID NOT NULL REFERENCES jobs(id),
    idempotency_key     VARCHAR(100) NOT NULL UNIQUE,
    amount_tzs          INTEGER NOT NULL,
    platform_fee_tzs    INTEGER NOT NULL DEFAULT 0,
    vat_tzs             INTEGER NOT NULL DEFAULT 0,
    net_tzs             INTEGER NOT NULL,
    payment_method      payment_method NOT NULL,
    direction           payment_direction NOT NULL,
    status              payment_status NOT NULL DEFAULT 'initiated',
    gateway_name        VARCHAR(50),
    gateway_reference   VARCHAR(200),
    gateway_raw_response JSONB,
    phone_number        VARCHAR(20),
    failure_reason      TEXT,
    retry_count         INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_job ON payment_transactions(job_id);
CREATE INDEX idx_payment_status ON payment_transactions(status);
CREATE INDEX idx_payment_idempotency ON payment_transactions(idempotency_key);
CREATE INDEX idx_payment_gateway_ref ON payment_transactions(gateway_reference) WHERE gateway_reference IS NOT NULL;

-- Down Migration
-- DROP TABLE IF EXISTS payment_transactions;
