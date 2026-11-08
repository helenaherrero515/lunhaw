-- Migration: 00015_green_index_eq005.sql
-- Green Index method EQ-005 (docs/methods.md): real per-place results with provenance.
--
-- * Computed yearly by scripts/green-index (satellite + OpenStreetMap inputs). Every value is an ESTIMATE.
-- * Rows start unpublished. A place's score becomes public only after a person photo-checks it
--   (scripts/green-index validate) and it is marked published. Until then the app shows "Not available yet".
-- * Replaces green_index_metrics (EQ-001), whose only data was simulated and was removed in 00014.

BEGIN;

CREATE TABLE IF NOT EXISTS green_index_runs (
    id TEXT PRIMARY KEY,                       -- e.g. 2026-11-09T03:00:00Z
    method_version TEXT NOT NULL,              -- e.g. 'EQ-005 v1'
    git_sha TEXT,
    period_start DATE NOT NULL,                -- Sentinel-2 window (dry season)
    period_end DATE NOT NULL,
    params JSONB NOT NULL,                     -- thresholds, targets, weights, Monte Carlo settings
    datasets JSONB NOT NULL,                   -- dataset ids, versions, licences, credit lines
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS green_index_results (
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    method_version TEXT NOT NULL,
    run_id TEXT NOT NULL REFERENCES green_index_runs(id),
    status TEXT NOT NULL DEFAULT 'ESTIMATE' CHECK (status IN ('ESTIMATE', 'NOT_AVAILABLE')),
    not_available_reason TEXT,

    -- Spatial unit
    unit_type TEXT NOT NULL CHECK (unit_type IN ('park_polygon', 'library_300m')),
    unit_source TEXT NOT NULL,                 -- 'OSM way/24159887' or '300 m buffer'
    unit_area_m2 NUMERIC(12, 1),

    -- Mutually exclusive land-cover fractions (percent of land in the unit; sum to ~100)
    tree_pct NUMERIC(5, 2),
    other_veg_pct NUMERIC(5, 2),
    water_pct NUMERIC(5, 2),
    sealed_pct NUMERIC(5, 2),
    bare_pct NUMERIC(5, 2),

    -- Sub-scores and score (0-100)
    canopy_sub NUMERIC(5, 2),
    other_sub NUMERIC(5, 2),
    unsealed_sub NUMERIC(5, 2),
    score NUMERIC(5, 2),
    score_p05 NUMERIC(5, 2),
    score_p95 NUMERIC(5, 2),
    band TEXT CHECK (band IN ('Low', 'Moderate', 'High')),
    band_flip_rate NUMERIC(4, 3),
    borderline BOOLEAN,

    -- Context (not scored)
    ndvi_mean NUMERIC(4, 3),
    ndvi_p10 NUMERIC(4, 3),
    ndvi_p90 NUMERIC(4, 3),
    n_clear_mean NUMERIC(5, 1),
    n_clear_min INTEGER,
    low_obs BOOLEAN,
    green_access_300m BOOLEAN,                 -- libraries: public green space >= 0.5 ha within 300 m
    canopy_imagery_from TEXT,                  -- canopy height imagery dates over the unit (YYYY-MM)
    canopy_imagery_to TEXT,
    s2_item_ids TEXT[],
    cross_check JSONB,                         -- e.g. ESA WorldCover tree / built-up shares

    -- Human check (publication gate)
    published BOOLEAN NOT NULL DEFAULT FALSE,
    checked_on DATE,
    check_points INTEGER,
    check_summary JSONB,

    computed_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (place_id, method_version),
    CONSTRAINT chk_gi_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    CONSTRAINT chk_gi_published_checked CHECK (NOT published OR (checked_on IS NOT NULL AND status = 'ESTIMATE'))
);

ALTER TABLE green_index_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE green_index_results ENABLE ROW LEVEL SECURITY;

-- The public sees only results a person has checked and published.
DROP POLICY IF EXISTS "Public read published green index" ON green_index_results;
CREATE POLICY "Public read published green index"
    ON green_index_results FOR SELECT TO anon, authenticated
    USING (published);

DROP POLICY IF EXISTS "Public read green index runs" ON green_index_runs;
CREATE POLICY "Public read green index runs"
    ON green_index_runs FOR SELECT TO anon, authenticated
    USING (TRUE);

GRANT SELECT ON green_index_results, green_index_runs TO anon, authenticated;
GRANT ALL ON green_index_results, green_index_runs TO service_role;

COMMENT ON TABLE green_index_metrics IS 'Deprecated (EQ-001). Superseded by green_index_results (EQ-005). Kept empty; migrations are forward-only.';

COMMIT;
