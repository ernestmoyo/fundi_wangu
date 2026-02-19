-- Up Migration: Auto-update updated_at timestamp on all relevant tables

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_fundi_profiles_updated_at BEFORE UPDATE ON fundi_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_fundi_wallets_updated_at BEFORE UPDATE ON fundi_wallets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON platform_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration
-- DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- DROP TRIGGER IF EXISTS update_fundi_profiles_updated_at ON fundi_profiles;
-- DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
-- DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
-- DROP TRIGGER IF EXISTS update_fundi_wallets_updated_at ON fundi_wallets;
-- DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes;
-- DROP TRIGGER IF EXISTS update_platform_config_updated_at ON platform_config;
-- DROP FUNCTION IF EXISTS set_updated_at();
