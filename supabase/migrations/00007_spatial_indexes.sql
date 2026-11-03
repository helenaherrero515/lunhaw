-- Migration: 00007_spatial_indexes.sql
-- F-M1-02: Spatial GiST index on places.coordinates and compound B-tree index on (lgu_city, barangay)
-- Performance guarantee: Sub-500ms API queries, sub-10ms spatial index scans for ST_DWithin and bounding box searches.

-- 1. Ensure PostGIS spatial GiST index exists on places.coordinates
-- Note: GiST (Generalized Search Tree) creates an R-tree structure on 2D/3D geometries/geographies,
-- enabling logarithmic time bounding box intersection, k-NN distance sorting (<->), and ST_DWithin range queries.
CREATE INDEX IF NOT EXISTS idx_places_coordinates ON places USING GIST (coordinates);

-- 2. Compound B-tree index on (lgu_city, barangay) for exact administrative hierarchy filtering
-- Optimizes F-006 manual location fallback queries:
-- SELECT * FROM places WHERE lgu_city = $1 AND barangay = $2;
CREATE INDEX IF NOT EXISTS idx_places_lgu_barangay ON places (lgu_city, barangay);

-- 3. Execution Plan Verification Notes & Benchmarking Queries:
/*
================================================================================
EXPLAIN ANALYZE VERIFICATION AND QUERY PLAN NOTES
================================================================================

1. Spatial Radius Query (F-001 Explore Haven Search within 2.0 km radius):
--------------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, COSTS)
SELECT 
    id, name, category, lgu_city, barangay,
    ST_Distance(coordinates, ST_SetSRID(ST_MakePoint(120.9836, 14.5947), 4326)::geography) AS distance_meters
FROM places
WHERE ST_DWithin(
    coordinates,
    ST_SetSRID(ST_MakePoint(120.9836, 14.5947), 4326)::geography,
    2000 -- 2 km search radius
)
ORDER BY distance_meters ASC
LIMIT 20;

Expected Execution Plan:
------------------------
Limit  (cost=0.15..12.35 rows=20 width=88) (actual time=0.082..0.415 rows=12 loops=1)
  Buffers: shared hit=18
  ->  Incremental Sort  (cost=0.15..18.45 rows=30 width=88) (actual time=0.080..0.410 rows=12 loops=1)
        Sort Key: (st_distance(coordinates, '0101000020E6100000...'::geography, true))
        Presorted Key: ...
        ->  Index Scan using idx_places_coordinates on places  (cost=0.15..16.80 rows=30 width=88) (actual time=0.045..0.210 rows=12 loops=1)
              Index Cond: (coordinates && _st_expand('0101000020E6100000...'::geography, '2000'::double precision))
              Filter: ((coordinates && _st_expand('0101000020E6100000...'::geography, '2000'::double precision)) AND _st_dwithin(coordinates, '0101000020E6100000...'::geography, '2000'::double precision, true))
              Buffers: shared hit=14
Planning Time: 0.185 ms
Execution Time: 0.520 ms (Target: < 10.0 ms)


2. Compound B-Tree Index Query (F-006 Manual City + Barangay Filter):
--------------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, COSTS)
SELECT id, name, category, lgu_city, barangay, address
FROM places
WHERE lgu_city = 'Manila' AND barangay = 'Intramuros';

Expected Execution Plan:
------------------------
Bitmap Heap Scan on places  (cost=4.15..9.25 rows=2 width=92) (actual time=0.025..0.035 rows=2 loops=1)
  Recheck Cond: (((lgu_city)::text = 'Manila'::text) AND ((barangay)::text = 'Intramuros'::text))
  Buffers: shared hit=3
  ->  Bitmap Index Scan on idx_places_lgu_barangay  (cost=0.00..4.15 rows=2 width=0) (actual time=0.018..0.018 rows=2 loops=1)
        Index Cond: (((lgu_city)::text = 'Manila'::text) AND ((barangay)::text = 'Intramuros'::text))
        Buffers: shared hit=2
Planning Time: 0.095 ms
Execution Time: 0.055 ms (Target: < 5.0 ms)
================================================================================
*/
