-- Migration: 00003_places.sql
-- F-M0-03: places table with coordinates GEOGRAPHY(Point, 4326), boundary_geojson, FK verification_id

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_category') THEN
        CREATE TYPE place_category AS ENUM ('park', 'garden', 'library', 'reading_center', 'civic_space');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category place_category NOT NULL,
    description TEXT NULL,
    lgu_city VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    address TEXT NULL,
    coordinates GEOGRAPHY(Point, 4326) NOT NULL,
    boundary_geojson JSONB NULL,
    verification_id UUID NOT NULL REFERENCES verification_meta(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial and relational indexes
CREATE INDEX IF NOT EXISTS idx_places_coordinates ON places USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_places_lgu_barangay ON places (lgu_city, barangay);
CREATE INDEX IF NOT EXISTS idx_places_category ON places (category);
CREATE INDEX IF NOT EXISTS idx_places_verification_id ON places (verification_id);
