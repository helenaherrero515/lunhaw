-- Migration: 00005_green_index.sql
-- F-M0-05: green_index_metrics table with chk_green_score_bounds 0.00 to 100.00

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'confidence_level') THEN
        CREATE TYPE confidence_level AS ENUM ('HIGH', 'MEDIUM', 'LOW');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS green_index_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    total_score DECIMAL(5,2) NOT NULL,
    canopy_cover_pct DECIMAL(5,2) NOT NULL,
    park_density_sqm_per_capita DECIMAL(8,2) NULL,
    measured_data_source VARCHAR(255) NOT NULL,
    estimate_method_note TEXT NULL,
    confidence_level confidence_level NOT NULL DEFAULT 'MEDIUM',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_green_score_bounds CHECK (total_score >= 0.0 AND total_score <= 100.0),
    CONSTRAINT chk_canopy_bounds CHECK (canopy_cover_pct >= 0.0 AND canopy_cover_pct <= 100.0),
    CONSTRAINT chk_park_density_bounds CHECK (park_density_sqm_per_capita IS NULL OR park_density_sqm_per_capita >= 0.0)
);

CREATE INDEX IF NOT EXISTS idx_green_index_place_id ON green_index_metrics(place_id);
CREATE INDEX IF NOT EXISTS idx_green_index_total_score ON green_index_metrics(total_score DESC);
