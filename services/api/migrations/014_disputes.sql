-- Up Migration: Job dispute resolution

CREATE TABLE disputes (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id              UUID NOT NULL UNIQUE REFERENCES jobs(id),
    raised_by_id        UUID NOT NULL REFERENCES users(id),
    status              dispute_status NOT NULL DEFAULT 'open',
    customer_statement  TEXT,
    fundi_statement     TEXT,
    customer_evidence   TEXT[] DEFAULT '{}',
    fundi_evidence      TEXT[] DEFAULT '{}',
    resolution          TEXT,
    resolved_by_id      UUID REFERENCES users(id),
    resolved_at         TIMESTAMPTZ,
    resolution_amount_customer_tzs INTEGER,
    resolution_amount_fundi_tzs    INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Down Migration
-- DROP TABLE IF EXISTS disputes;
