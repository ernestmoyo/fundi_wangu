-- Up Migration: Customer reviews with auto-rating trigger

CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id              UUID NOT NULL UNIQUE REFERENCES jobs(id),
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewee_id         UUID NOT NULL REFERENCES users(id),
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment_text        VARCHAR(300),
    language            preferred_language NOT NULL DEFAULT 'sw',
    fundi_response_text VARCHAR(300),
    fundi_responded_at  TIMESTAMPTZ,
    is_flagged          BOOLEAN NOT NULL DEFAULT false,
    flag_reason         TEXT,
    is_published        BOOLEAN NOT NULL DEFAULT true,
    tip_tzs             INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_job ON reviews(job_id);

-- Auto-update Fundi overall_rating when a review is created or modified
CREATE OR REPLACE FUNCTION update_fundi_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE fundi_profiles
    SET
        overall_rating = (
            SELECT ROUND(AVG(rating)::NUMERIC, 2)
            FROM reviews
            WHERE reviewee_id = NEW.reviewee_id AND is_published = true
        ),
        updated_at = NOW()
    WHERE user_id = NEW.reviewee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_fundi_rating();

-- Down Migration
-- DROP TRIGGER IF EXISTS on_review_change ON reviews;
-- DROP FUNCTION IF EXISTS update_fundi_rating();
-- DROP TABLE IF EXISTS reviews;
