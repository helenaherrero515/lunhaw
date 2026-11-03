-- Migration: 00008_rls_public_read.sql
-- F-M1-03: Row Level Security (RLS) policies granting public SELECT to anon/authenticated,
-- restricting INSERT, UPDATE, DELETE to service_role on civic data tables.
-- Traceability: Security, INV-003, F-M1-03

-- 1. Enable RLS on all public tables
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_index_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgu_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies to allow idempotent execution
DROP POLICY IF EXISTS "Public read access for places" ON places;
DROP POLICY IF EXISTS "Service role write access for places" ON places;

DROP POLICY IF EXISTS "Public read access for library_details" ON library_details;
DROP POLICY IF EXISTS "Service role write access for library_details" ON library_details;

DROP POLICY IF EXISTS "Public read access for operating_hours" ON operating_hours;
DROP POLICY IF EXISTS "Service role write access for operating_hours" ON operating_hours;

DROP POLICY IF EXISTS "Public read access for green_index_metrics" ON green_index_metrics;
DROP POLICY IF EXISTS "Service role write access for green_index_metrics" ON green_index_metrics;

DROP POLICY IF EXISTS "Public read access for verification_meta" ON verification_meta;
DROP POLICY IF EXISTS "Service role write access for verification_meta" ON verification_meta;

DROP POLICY IF EXISTS "Public read access for lgu_regions" ON lgu_regions;
DROP POLICY IF EXISTS "Service role write access for lgu_regions" ON lgu_regions;

DROP POLICY IF EXISTS "Public read access for barangays" ON barangays;
DROP POLICY IF EXISTS "Service role write access for barangays" ON barangays;

-- 3. Public Read Policies: Allow SELECT to anon and authenticated roles
CREATE POLICY "Public read access for places"
    ON places FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public read access for library_details"
    ON library_details FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public read access for operating_hours"
    ON operating_hours FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public read access for green_index_metrics"
    ON green_index_metrics FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public read access for verification_meta"
    ON verification_meta FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public read access for lgu_regions"
    ON lgu_regions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Public read access for barangays"
    ON barangays FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Service Role Policies: Restrict INSERT, UPDATE, DELETE strictly to service_role
CREATE POLICY "Service role write access for places"
    ON places FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role write access for library_details"
    ON library_details FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role write access for operating_hours"
    ON operating_hours FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role write access for green_index_metrics"
    ON green_index_metrics FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role write access for verification_meta"
    ON verification_meta FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role write access for lgu_regions"
    ON lgu_regions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role write access for barangays"
    ON barangays FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
