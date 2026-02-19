-- Up Migration: Business accounts, members, properties, and Fundi whitelist

CREATE TABLE business_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID NOT NULL REFERENCES users(id),
    business_name   VARCHAR(200) NOT NULL,
    tin_number      VARCHAR(50),
    brela_number    VARCHAR(50),
    billing_email   VARCHAR(255),
    billing_address TEXT,
    subscription_type VARCHAR(20) DEFAULT 'standard',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    role            VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_properties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES business_accounts(id),
    name            VARCHAR(200) NOT NULL,
    address_text    TEXT NOT NULL,
    location        GEOGRAPHY(POINT, 4326),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_fundi_whitelist (
    business_id     UUID NOT NULL REFERENCES business_accounts(id),
    fundi_id        UUID NOT NULL REFERENCES users(id),
    property_id     UUID REFERENCES business_properties(id),
    added_by_id     UUID NOT NULL REFERENCES users(id),
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (business_id, fundi_id, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

-- Down Migration
-- DROP TABLE IF EXISTS business_fundi_whitelist;
-- DROP TABLE IF EXISTS business_properties;
-- DROP TABLE IF EXISTS business_members;
-- DROP TABLE IF EXISTS business_accounts CASCADE;
