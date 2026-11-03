-- Migration: 00010_transit_tables.sql
-- F-M2-01: Create transit_routes, transit_stops, and route_legs tables
-- Enables transit network topology, line geometries, transit modes, and fare references.
-- Traces back to: F-003, INV-001, EQ-002, EQ-003, EQ-004, docs/data-model.md

-- 1. Create Enums for Transit Modes and Leg Modes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transit_mode') THEN
        CREATE TYPE transit_mode AS ENUM ('walk', 'jeepney', 'bus', 'lrt_mrt', 'uv_express', 'multimodal');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leg_mode') THEN
        CREATE TYPE leg_mode AS ENUM ('walk', 'transit_board', 'transit_ride', 'transfer');
    END IF;
END $$;

-- 2. Create transit_stops Table
CREATE TABLE IF NOT EXISTS transit_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NULL,
    transit_mode transit_mode NOT NULL,
    line_name VARCHAR(100) NULL,
    lgu_city VARCHAR(100) NOT NULL,
    coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    wheelchair_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    verification_id UUID NOT NULL REFERENCES verification_meta(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transit_stops
CREATE INDEX IF NOT EXISTS idx_transit_stops_coordinates ON transit_stops USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_transit_stops_transit_mode ON transit_stops(transit_mode);
CREATE INDEX IF NOT EXISTS idx_transit_stops_line_name ON transit_stops(line_name);
CREATE INDEX IF NOT EXISTS idx_transit_stops_lgu_city ON transit_stops(lgu_city);
CREATE INDEX IF NOT EXISTS idx_transit_stops_verification_id ON transit_stops(verification_id);

-- 3. Create transit_routes Table
CREATE TABLE IF NOT EXISTS transit_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    transit_mode transit_mode NOT NULL,
    total_distance_meters DECIMAL(10,2) NOT NULL,
    est_duration_seconds INTEGER NOT NULL,
    base_fare_php DECIMAL(6,2) NOT NULL,
    fare_per_km_php DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    path_geometry GEOMETRY(LineString, 4326) NULL,
    path_geometry_geojson JSONB NULL,
    fare_verification_id UUID NOT NULL REFERENCES verification_meta(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_transit_route_distance CHECK (total_distance_meters >= 0.0),
    CONSTRAINT chk_transit_route_duration CHECK (est_duration_seconds >= 0),
    CONSTRAINT chk_transit_route_base_fare CHECK (base_fare_php >= 0.00),
    CONSTRAINT chk_transit_route_fare_per_km CHECK (fare_per_km_php >= 0.00)
);

-- Indexes for transit_routes
CREATE INDEX IF NOT EXISTS idx_transit_routes_path_geom ON transit_routes USING GIST (path_geometry);
CREATE INDEX IF NOT EXISTS idx_transit_routes_mode ON transit_routes(transit_mode);
CREATE INDEX IF NOT EXISTS idx_transit_routes_code ON transit_routes(route_code);
CREATE INDEX IF NOT EXISTS idx_transit_routes_fare_verif ON transit_routes(fare_verification_id);

-- 4. Create route_legs Table
CREATE TABLE IF NOT EXISTS route_legs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES transit_routes(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    leg_mode leg_mode NOT NULL,
    instruction TEXT NOT NULL,
    from_stop_id UUID NULL REFERENCES transit_stops(id) ON DELETE SET NULL,
    to_stop_id UUID NULL REFERENCES transit_stops(id) ON DELETE SET NULL,
    leg_distance_meters DECIMAL(10,2) NOT NULL,
    leg_duration_seconds INTEGER NOT NULL,
    shade_coverage_pct DECIMAL(5,2) NULL,
    path_geometry GEOMETRY(LineString, 4326) NULL,
    leg_verification_id UUID NOT NULL REFERENCES verification_meta(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_route_leg_sequence CHECK (sequence_order >= 1),
    CONSTRAINT chk_route_leg_distance CHECK (leg_distance_meters >= 0.0),
    CONSTRAINT chk_route_leg_duration CHECK (leg_duration_seconds >= 0),
    CONSTRAINT chk_route_leg_shade CHECK (shade_coverage_pct IS NULL OR (shade_coverage_pct >= 0.0 AND shade_coverage_pct <= 100.0)),
    CONSTRAINT uq_route_legs_route_sequence UNIQUE (route_id, sequence_order)
);

-- Indexes for route_legs
CREATE INDEX IF NOT EXISTS idx_route_legs_route_id ON route_legs(route_id);
CREATE INDEX IF NOT EXISTS idx_route_legs_from_stop ON route_legs(from_stop_id);
CREATE INDEX IF NOT EXISTS idx_route_legs_to_stop ON route_legs(to_stop_id);
CREATE INDEX IF NOT EXISTS idx_route_legs_mode ON route_legs(leg_mode);
CREATE INDEX IF NOT EXISTS idx_route_legs_path_geom ON route_legs USING GIST (path_geometry);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE transit_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transit_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_legs ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies for idempotent migration execution
DROP POLICY IF EXISTS "Public read access for transit_stops" ON transit_stops;
DROP POLICY IF EXISTS "Service role write access for transit_stops" ON transit_stops;
DROP POLICY IF EXISTS "Public read access for transit_routes" ON transit_routes;
DROP POLICY IF EXISTS "Service role write access for transit_routes" ON transit_routes;
DROP POLICY IF EXISTS "Public read access for route_legs" ON route_legs;
DROP POLICY IF EXISTS "Service role write access for route_legs" ON route_legs;

-- Public Read Policies
CREATE POLICY "Public read access for transit_stops"
    ON transit_stops FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Service role write access for transit_stops"
    ON transit_stops FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public read access for transit_routes"
    ON transit_routes FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Service role write access for transit_routes"
    ON transit_routes FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Public read access for route_legs"
    ON route_legs FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Service role write access for route_legs"
    ON route_legs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
