-- Up Migration: In-app messaging within job context

CREATE TABLE job_messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0),
    is_system   BOOLEAN NOT NULL DEFAULT false,
    language    preferred_language NOT NULL DEFAULT 'sw',
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at     TIMESTAMPTZ
);

CREATE INDEX idx_messages_job ON job_messages(job_id, sent_at);

-- Down Migration
-- DROP TABLE IF EXISTS job_messages;
