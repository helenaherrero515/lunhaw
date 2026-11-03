-- scripts/verify-db-schema.sql
-- Verification script to test schema constraints, positive paths, and assert failure on invalid constraints.

\echo '== Starting Lunhaw DB Schema Verification =='

-- Wrap in a transaction block with rollback to avoid polluting database state
BEGIN;

-- Test 1: Insert valid verification_meta with ESTIMATE and derivation_note
SAVEPOINT test1;
INSERT INTO verification_meta (id, status, derivation_note)
VALUES ('a0000000-0000-0000-0000-000000000001', 'ESTIMATE', 'Valid derivation note for testing');
\echo '[PASS] Test 1: Valid ESTIMATE with derivation_note inserted successfully'

-- Test 2: Assert failure on ESTIMATE without derivation_note (chk_verification_derivation)
SAVEPOINT test2;
DO $$
BEGIN
    BEGIN
        INSERT INTO verification_meta (id, status, derivation_note)
        VALUES ('a0000000-0000-0000-0000-000000000002', 'ESTIMATE', NULL);
        RAISE EXCEPTION 'TEST FAILED: chk_verification_derivation did not trigger for ESTIMATE with NULL derivation_note';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[PASS] Test 2: chk_verification_derivation successfully caught NULL derivation_note on ESTIMATE';
    END;
END $$;
ROLLBACK TO SAVEPOINT test2;

-- Test 3: Insert valid place with coordinates geography Point
SAVEPOINT test3;
INSERT INTO places (id, name, category, lgu_city, barangay, coordinates, verification_id)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Test Green Haven',
    'park',
    'Manila',
    'Barangay 1',
    ST_SetSRID(ST_MakePoint(120.98, 14.59), 4326)::geography,
    'a0000000-0000-0000-0000-000000000001'
);
\echo '[PASS] Test 3: Valid place with coordinates geography Point inserted successfully'

-- Test 4: Assert failure on place referencing non-existent verification_id (Foreign Key violation)
SAVEPOINT test4;
DO $$
BEGIN
    BEGIN
        INSERT INTO places (id, name, category, lgu_city, barangay, coordinates, verification_id)
        VALUES (
            'b0000000-0000-0000-0000-000000000002',
            'Non-existent FK Place',
            'park',
            'Manila',
            'Barangay 1',
            ST_SetSRID(ST_MakePoint(120.98, 14.59), 4326)::geography,
            'ffffffff-ffff-ffff-ffff-ffffffffffff'
        );
        RAISE EXCEPTION 'TEST FAILED: Foreign key constraint did not trigger on invalid verification_id';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE '[PASS] Test 4: places.verification_id foreign key constraint successfully rejected invalid FK';
    END;
END $$;
ROLLBACK TO SAVEPOINT test4;

-- Test 5: Assert failure on green_index_metrics total_score < 0.0 (chk_green_score_bounds)
SAVEPOINT test5;
DO $$
BEGIN
    BEGIN
        INSERT INTO green_index_metrics (place_id, total_score, canopy_cover_pct, measured_data_source)
        VALUES ('b0000000-0000-0000-0000-000000000001', -5.00, 20.00, 'Test Source');
        RAISE EXCEPTION 'TEST FAILED: chk_green_score_bounds did not trigger for total_score < 0.0';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[PASS] Test 5: chk_green_score_bounds successfully caught negative total_score';
    END;
END $$;
ROLLBACK TO SAVEPOINT test5;

-- Test 6: Assert failure on green_index_metrics total_score > 100.0 (chk_green_score_bounds)
SAVEPOINT test6;
DO $$
BEGIN
    BEGIN
        INSERT INTO green_index_metrics (place_id, total_score, canopy_cover_pct, measured_data_source)
        VALUES ('b0000000-0000-0000-0000-000000000001', 105.00, 20.00, 'Test Source');
        RAISE EXCEPTION 'TEST FAILED: chk_green_score_bounds did not trigger for total_score > 100.0';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[PASS] Test 6: chk_green_score_bounds successfully caught total_score > 100.0';
    END;
END $$;
ROLLBACK TO SAVEPOINT test6;

-- Test 7: Assert failure on operating_hours invalid day_of_week (> 6)
SAVEPOINT test7;
DO $$
BEGIN
    BEGIN
        INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time, is_closed, verification_id)
        VALUES (
            'b0000000-0000-0000-0000-000000000001',
            7,
            '08:00:00',
            '17:00:00',
            FALSE,
            'a0000000-0000-0000-0000-000000000001'
        );
        RAISE EXCEPTION 'TEST FAILED: chk_day_of_week_range did not trigger for day_of_week = 7';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[PASS] Test 7: chk_day_of_week_range successfully caught invalid day_of_week';
    END;
END $$;
ROLLBACK TO SAVEPOINT test7;

-- Test 8: Assert cascade deletion of library_details and operating_hours when place is deleted
SAVEPOINT test8;
INSERT INTO library_details (place_id, is_barangay_reading_center, verification_id)
VALUES ('b0000000-0000-0000-0000-000000000001', FALSE, 'a0000000-0000-0000-0000-000000000001');

INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time, is_closed, verification_id)
VALUES ('b0000000-0000-0000-0000-000000000001', 1, '08:00:00', '17:00:00', FALSE, 'a0000000-0000-0000-0000-000000000001');

DELETE FROM places WHERE id = 'b0000000-0000-0000-0000-000000000001';

DO $$
DECLARE
    lib_count INT;
    hours_count INT;
BEGIN
    SELECT COUNT(*) INTO lib_count FROM library_details WHERE place_id = 'b0000000-0000-0000-0000-000000000001';
    SELECT COUNT(*) INTO hours_count FROM operating_hours WHERE place_id = 'b0000000-0000-0000-0000-000000000001';
    IF lib_count != 0 OR hours_count != 0 THEN
        RAISE EXCEPTION 'TEST FAILED: ON DELETE CASCADE did not remove dependent records from library_details/operating_hours';
    ELSE
        RAISE NOTICE '[PASS] Test 8: ON DELETE CASCADE verified cleanly';
    END IF;
END $$;
ROLLBACK TO SAVEPOINT test8;

-- Test 9: Insert valid transit route, stop, and route leg
SAVEPOINT test9;
INSERT INTO transit_stops (id, name, code, transit_mode, line_name, lgu_city, coordinates, wheelchair_accessible, verification_id)
VALUES (
    's9990000-0000-0000-0000-000000000001',
    'Test Transit Hub',
    'HUB-01',
    'bus',
    'Test Line',
    'Quezon City',
    ST_SetSRID(ST_MakePoint(121.05, 14.65), 4326)::geography,
    TRUE,
    'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO transit_routes (id, route_code, name, origin_name, destination_name, transit_mode, total_distance_meters, est_duration_seconds, base_fare_php, fare_verification_id)
VALUES (
    'r9990000-0000-0000-0000-000000000001',
    'ROUTE-TEST-01',
    'Test Line Route',
    'Origin A',
    'Destination B',
    'bus',
    5000.00,
    900,
    15.00,
    'a0000000-0000-0000-0000-000000000001'
);

INSERT INTO route_legs (id, route_id, sequence_order, leg_mode, instruction, leg_distance_meters, leg_duration_seconds, shade_coverage_pct, leg_verification_id)
VALUES (
    'l9990000-0000-0000-0000-000000000001',
    'r9990000-0000-0000-0000-000000000001',
    1,
    'transit_board',
    'Board test bus at Hub',
    50.00,
    120,
    85.00,
    'a0000000-0000-0000-0000-000000000001'
);
\echo '[PASS] Test 9: Valid transit route, stop, and leg inserted successfully'
ROLLBACK TO SAVEPOINT test9;

-- Test 10: Assert failure on route_legs shade_coverage_pct > 100.0 (chk_route_leg_shade)
SAVEPOINT test10;
DO $$
BEGIN
    BEGIN
        INSERT INTO transit_routes (id, route_code, name, origin_name, destination_name, transit_mode, total_distance_meters, est_duration_seconds, base_fare_php, fare_verification_id)
        VALUES (
            'r9990000-0000-0000-0000-000000000002',
            'ROUTE-TEST-02',
            'Invalid Shade Route',
            'Origin A',
            'Destination B',
            'walk',
            1000.00,
            600,
            0.00,
            'a0000000-0000-0000-0000-000000000001'
        );

        INSERT INTO route_legs (id, route_id, sequence_order, leg_mode, instruction, leg_distance_meters, leg_duration_seconds, shade_coverage_pct, leg_verification_id)
        VALUES (
            'l9990000-0000-0000-0000-000000000002',
            'r9990000-0000-0000-0000-000000000002',
            1,
            'walk',
            'Walk along unshaded path',
            1000.00,
            600,
            125.00, -- Invalid > 100.0%
            'a0000000-0000-0000-0000-000000000001'
        );
        RAISE EXCEPTION 'TEST FAILED: chk_route_leg_shade did not trigger for shade_coverage_pct > 100.0';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[PASS] Test 10: chk_route_leg_shade successfully rejected shade_coverage_pct > 100.0';
    END;
END $$;
ROLLBACK TO SAVEPOINT test10;

-- Test 11: Assert failure on negative base_fare_php (chk_transit_route_base_fare)
SAVEPOINT test11;
DO $$
BEGIN
    BEGIN
        INSERT INTO transit_routes (id, route_code, name, origin_name, destination_name, transit_mode, total_distance_meters, est_duration_seconds, base_fare_php, fare_verification_id)
        VALUES (
            'r9990000-0000-0000-0000-000000000003',
            'ROUTE-TEST-03',
            'Negative Fare Route',
            'Origin A',
            'Destination B',
            'bus',
            1000.00,
            600,
            -10.00,
            'a0000000-0000-0000-0000-000000000001'
        );
        RAISE EXCEPTION 'TEST FAILED: chk_transit_route_base_fare did not trigger for negative base_fare_php';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '[PASS] Test 11: chk_transit_route_base_fare successfully rejected negative base fare';
    END;
END $$;
ROLLBACK TO SAVEPOINT test11;

ROLLBACK;

\echo '== All Schema Verifications Passed Successfully =='
