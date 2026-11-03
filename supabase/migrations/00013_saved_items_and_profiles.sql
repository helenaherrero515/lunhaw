-- Migration: 00013_saved_items_and_profiles.sql
-- F-M3-01: Create saved_items and user_profiles tables with RLS user isolation.
-- Enables pseudonymous session bookmarks, authenticated user profiles, route saving,
-- and freshness audit indexing (BR-002, T-005).
-- Traces to: F-005, INV-001, T-003, BR-002, docs/data-model.md

-- 1. Ensure auth schema and auth.users exist for local development / testing environments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        CREATE SCHEMA auth;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        CREATE TABLE auth.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
END $$;

-- 2. Create user_profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NULL,
    avatar_url TEXT NULL,
    preferred_transit_mode VARCHAR(50) NULL,
    home_lgu VARCHAR(100) NULL,
    home_barangay VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_home_lgu ON user_profiles(home_lgu);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at);

-- 3. Create saved_items Table
CREATE TABLE IF NOT EXISTS saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_session_id VARCHAR(100) NULL,
    item_type VARCHAR(20) NOT NULL,
    place_id UUID NULL REFERENCES places(id) ON DELETE CASCADE,
    route_id UUID NULL REFERENCES transit_routes(id) ON DELETE SET NULL,
    route_data JSONB NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_saved_item_type CHECK (item_type IN ('place', 'route')),
    CONSTRAINT chk_saved_item_owner CHECK (user_id IS NOT NULL OR client_session_id IS NOT NULL),
    CONSTRAINT chk_saved_item_target CHECK (
        (item_type = 'place' AND place_id IS NOT NULL) OR
        (item_type = 'route' AND (route_id IS NOT NULL OR route_data IS NOT NULL))
    )
);

-- Relational indexes for saved_items
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_session_id ON saved_items(client_session_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_item_type ON saved_items(item_type);
CREATE INDEX IF NOT EXISTS idx_saved_items_place_id ON saved_items(place_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_route_id ON saved_items(route_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_created_at ON saved_items(created_at);

-- Partial unique constraints preventing duplicate bookmarks per user or session
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_user_place
    ON saved_items(user_id, place_id)
    WHERE user_id IS NOT NULL AND place_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_session_place
    ON saved_items(client_session_id, place_id)
    WHERE client_session_id IS NOT NULL AND place_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_user_route
    ON saved_items(user_id, route_id)
    WHERE user_id IS NOT NULL AND route_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_items_session_route
    ON saved_items(client_session_id, route_id)
    WHERE client_session_id IS NOT NULL AND route_id IS NOT NULL;

-- 4. Freshness Audit Optimization (BR-002, T-005)
-- Index to optimize querying records needing re-verification (>180 days)
CREATE INDEX IF NOT EXISTS idx_verification_meta_last_verified_at
    ON verification_meta(last_verified_at);

-- Convenience view for records requiring re-verification
CREATE OR REPLACE VIEW stale_verifications AS
SELECT
    id,
    status,
    official_source_name,
    official_source_url,
    derivation_note,
    last_verified_at,
    verified_by,
    created_at,
    CASE
        WHEN last_verified_at IS NULL THEN TRUE
        WHEN last_verified_at < NOW() - INTERVAL '180 days' THEN TRUE
        ELSE FALSE
    END AS is_stale,
    EXTRACT(DAY FROM (NOW() - COALESCE(last_verified_at, created_at))) AS days_since_verification
FROM verification_meta
WHERE last_verified_at < NOW() - INTERVAL '180 days' OR last_verified_at IS NULL;

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotent migration execution
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role full access on user_profiles" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own saved_items" ON saved_items;
DROP POLICY IF EXISTS "Users can insert own saved_items" ON saved_items;
DROP POLICY IF EXISTS "Users can update own saved_items" ON saved_items;
DROP POLICY IF EXISTS "Users can delete own saved_items" ON saved_items;
DROP POLICY IF EXISTS "Service role full access on saved_items" ON saved_items;

-- 5.1 user_profiles Policies
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON user_profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Service role full access on user_profiles"
    ON user_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5.2 saved_items Policies (Isolating users by auth.uid() or client_session_id)
CREATE POLICY "Users can view own saved_items"
    ON saved_items FOR SELECT
    TO anon, authenticated
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (client_session_id IS NOT NULL AND (
            client_session_id = NULLIF(current_setting('request.headers', true)::json->>'x-session-id', '')
            OR
            client_session_id = NULLIF(current_setting('app.current_session_id', true), '')
        ))
    );

CREATE POLICY "Users can insert own saved_items"
    ON saved_items FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (client_session_id IS NOT NULL AND (
            client_session_id = NULLIF(current_setting('request.headers', true)::json->>'x-session-id', '')
            OR
            client_session_id = NULLIF(current_setting('app.current_session_id', true), '')
        ))
    );

CREATE POLICY "Users can update own saved_items"
    ON saved_items FOR UPDATE
    TO anon, authenticated
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (client_session_id IS NOT NULL AND (
            client_session_id = NULLIF(current_setting('request.headers', true)::json->>'x-session-id', '')
            OR
            client_session_id = NULLIF(current_setting('app.current_session_id', true), '')
        ))
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (client_session_id IS NOT NULL AND (
            client_session_id = NULLIF(current_setting('request.headers', true)::json->>'x-session-id', '')
            OR
            client_session_id = NULLIF(current_setting('app.current_session_id', true), '')
        ))
    );

CREATE POLICY "Users can delete own saved_items"
    ON saved_items FOR DELETE
    TO anon, authenticated
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (client_session_id IS NOT NULL AND (
            client_session_id = NULLIF(current_setting('request.headers', true)::json->>'x-session-id', '')
            OR
            client_session_id = NULLIF(current_setting('app.current_session_id', true), '')
        ))
    );

CREATE POLICY "Service role full access on saved_items"
    ON saved_items FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
