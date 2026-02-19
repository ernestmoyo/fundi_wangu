-- Up Migration: Jobs / Bookings — the core of the platform

CREATE TABLE jobs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_reference       VARCHAR(20) NOT NULL UNIQUE,
    customer_id         UUID NOT NULL REFERENCES users(id),
    fundi_id            UUID REFERENCES users(id),
    agent_id            UUID REFERENCES users(id),
    category            VARCHAR(100) NOT NULL,
    service_items       JSONB NOT NULL DEFAULT '[]',
    description_text    TEXT NOT NULL,
    description_photos  TEXT[] DEFAULT '{}',
    location            GEOGRAPHY(POINT, 4326) NOT NULL,
    address_text        TEXT NOT NULL,
    address_district    VARCHAR(100),
    address_ward        VARCHAR(100),
    scheduled_at        TIMESTAMPTZ,
    status              job_status NOT NULL DEFAULT 'pending',
    quoted_amount_tzs   INTEGER NOT NULL,
    final_amount_tzs    INTEGER,
    platform_fee_tzs    INTEGER NOT NULL,
    vat_tzs             INTEGER NOT NULL,
    net_to_fundi_tzs    INTEGER,
    payment_method      payment_method NOT NULL,
    completion_photos   TEXT[] DEFAULT '{}',
    fundi_notes         TEXT,
    is_womens_filter    BOOLEAN NOT NULL DEFAULT false,
    accepted_at         TIMESTAMPTZ,
    en_route_at         TIMESTAMPTZ,
    arrived_at          TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancelled_by        UUID REFERENCES users(id),
    cancellation_reason TEXT,
    disputed_at         TIMESTAMPTZ,
    escrow_release_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_fundi ON jobs(fundi_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX idx_jobs_reference ON jobs(job_reference);

-- Human-readable job reference sequence: FW-2024-0001234
CREATE SEQUENCE job_reference_seq START 1000;

CREATE OR REPLACE FUNCTION generate_job_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.job_reference := 'FW-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('job_reference_seq')::TEXT, 7, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_reference
    BEFORE INSERT ON jobs
    FOR EACH ROW EXECUTE FUNCTION generate_job_reference();

-- Down Migration
-- DROP TRIGGER IF EXISTS set_job_reference ON jobs;
-- DROP FUNCTION IF EXISTS generate_job_reference();
-- DROP SEQUENCE IF EXISTS job_reference_seq;
-- DROP TABLE IF EXISTS jobs CASCADE;
