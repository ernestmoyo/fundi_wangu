-- Up Migration: Notification delivery audit trail

CREATE TABLE notification_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    channel         notification_channel NOT NULL,
    template_key    VARCHAR(100) NOT NULL,
    content_sw      TEXT,
    content_en      TEXT,
    job_id          UUID REFERENCES jobs(id),
    was_delivered   BOOLEAN,
    delivered_at    TIMESTAMPTZ,
    failure_reason  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON notification_log(user_id, created_at DESC);

-- Down Migration
-- DROP TABLE IF EXISTS notification_log;
