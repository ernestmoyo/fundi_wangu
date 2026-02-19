-- Up Migration: Add scope change columns to jobs table
-- Supports on-site scope changes (additional work discovered by Fundi)

ALTER TABLE jobs ADD COLUMN scope_change_amount_tzs INTEGER;
ALTER TABLE jobs ADD COLUMN scope_change_reason TEXT;
ALTER TABLE jobs ADD COLUMN scope_change_status VARCHAR(20) DEFAULT NULL
    CHECK (scope_change_status IN ('pending', 'approved', 'rejected'));

-- Job assignment log: tracks which Mafundi were offered a job
CREATE TABLE job_assignment_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    fundi_id    UUID NOT NULL REFERENCES users(id),
    response    VARCHAR(20) NOT NULL CHECK (response IN ('pending', 'accepted', 'declined', 'expired')),
    offered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(job_id, fundi_id)
);

CREATE INDEX idx_job_assignment_log_job ON job_assignment_log(job_id);
CREATE INDEX idx_job_assignment_log_fundi ON job_assignment_log(fundi_id);

-- Down Migration
-- ALTER TABLE jobs DROP COLUMN scope_change_amount_tzs;
-- ALTER TABLE jobs DROP COLUMN scope_change_reason;
-- ALTER TABLE jobs DROP COLUMN scope_change_status;
-- DROP TABLE IF EXISTS job_assignment_log CASCADE;
