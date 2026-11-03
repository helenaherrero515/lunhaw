-- Seed baseline verification_meta and sample places conforming to schema and constraints
-- F-M0-06: Baseline seed data

-- Clean up any prior seed data in reverse dependency order
DELETE FROM green_index_metrics;
DELETE FROM operating_hours;
DELETE FROM library_details;
DELETE FROM places;
DELETE FROM verification_meta;

-- 1. Insert verification_meta records
INSERT INTO verification_meta (id, status, official_source_name, official_source_url, derivation_note, last_verified_at, verified_by)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'VERIFIED',
        'Quezon City Public Library Main Branch Official Portal',
        'https://qcpubliclibrary.quezoncity.gov.ph',
        NULL,
        '2026-01-15T08:00:00Z',
        'QC LGU Ingestion v1'
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'VERIFIED',
        'National Parks Development Committee (NPDC)',
        'https://npdc.gov.ph/luneta-park',
        NULL,
        '2026-02-01T09:30:00Z',
        'NPDC Open Data Portal'
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'ESTIMATE',
        'Sentinel-2 Open Earth Engine 10m NDVI & LGU GIS Boundary Estimation',
        'https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED',
        'Derived using Sentinel-2 2025 multi-temporal NDVI composite within projected LGU urban buffer zones. Park boundary estimated via OpenStreetMap civic boundary polygon.',
        '2026-02-10T14:15:00Z',
        'Lunhaw Automated NDVI Pipeline v0.4'
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'NOT_AVAILABLE',
        'Manila City Hall Tourism and Public Recreation Office',
        NULL,
        NULL,
        NULL,
        'Manual Field Survey Pending'
    );

-- 2. Insert sample places (coordinates SRID 4326: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
INSERT INTO places (id, name, category, description, lgu_city, barangay, address, coordinates, boundary_geojson, verification_id)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'Quezon City Public Library - Main Branch',
        'library',
        'The main central public library of Quezon City with multi-level study carrels, free Wi-Fi, and air-conditioned reading halls.',
        'Quezon City',
        'Central',
        'City Hall Complex, Mayaman St, Diliman, Quezon City',
        ST_SetSRID(ST_MakePoint(121.0504, 14.6468), 4326)::geography,
        NULL,
        '10000000-0000-0000-0000-000000000001'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'Rizal Park (Luneta)',
        'park',
        'One of the largest urban parks in the Philippines, featuring wide open lawns, ornamental gardens, and historical monuments.',
        'Manila',
        'Barangay 666',
        'Roxas Blvd, Ermita, Manila',
        ST_SetSRID(ST_MakePoint(120.9794, 14.5831), 4326)::geography,
        '{"type":"Polygon","coordinates":[[[120.975,14.580],[120.983,14.580],[120.983,14.586],[120.975,14.586],[120.975,14.580]]]}'::jsonb,
        '10000000-0000-0000-0000-000000000002'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'Arroceros Forest Park',
        'park',
        'Referred to as Manila''s Last Lung, an urban forest park located on the bank of the Pasig River featuring lush canopy shade.',
        'Manila',
        'Barangay 659-A',
        '659 A Flores St, Ermita, Manila',
        ST_SetSRID(ST_MakePoint(120.9836, 14.5947), 4326)::geography,
        NULL,
        '10000000-0000-0000-0000-000000000003'
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        'Barangay Pinyahan Community Reading Center',
        'reading_center',
        'Neighborhood quiet reading nook and public homework center for barangay residents.',
        'Quezon City',
        'Pinyahan',
        'Malakas St, Brgy Pinyahan, Quezon City',
        ST_SetSRID(ST_MakePoint(121.0521, 14.6419), 4326)::geography,
        NULL,
        '10000000-0000-0000-0000-000000000001'
    );

-- 3. Insert library_details
INSERT INTO library_details (place_id, is_barangay_reading_center, desk_capacity, has_power_outlets, has_wifi, has_aircon, access_requirements, fee_description, verification_id)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        FALSE,
        250,
        TRUE,
        TRUE,
        TRUE,
        'Open to public. Valid government or student ID required for Wi-Fi access voucher.',
        'Free',
        '10000000-0000-0000-0000-000000000001'
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        TRUE,
        24,
        TRUE,
        FALSE,
        TRUE,
        'Barangay ID or Student ID required.',
        'Free',
        '10000000-0000-0000-0000-000000000001'
    );

-- 4. Insert operating_hours (0 = Sun, 1 = Mon ... 6 = Sat)
INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time, is_closed, schedule_label, verification_id)
VALUES
    -- QC Library Main Branch (Mon-Fri 08:00-17:00, Sat 08:00-16:00, Sun Closed)
    ('20000000-0000-0000-0000-000000000001', 0, NULL, NULL, TRUE, 'Sunday Closed', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 1, '08:00:00', '17:00:00', FALSE, 'Regular Hours', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 2, '08:00:00', '17:00:00', FALSE, 'Regular Hours', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 3, '08:00:00', '17:00:00', FALSE, 'Regular Hours', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 4, '08:00:00', '17:00:00', FALSE, 'Regular Hours', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 5, '08:00:00', '17:00:00', FALSE, 'Regular Hours', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 6, '08:00:00', '16:00:00', FALSE, 'Saturday Half-Day Schedule', '10000000-0000-0000-0000-000000000001'),

    -- Rizal Park (Open 05:00 - 21:00 daily)
    ('20000000-0000-0000-0000-000000000002', 0, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', 1, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', 2, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', 3, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', 4, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', 5, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000002', 6, '05:00:00', '21:00:00', FALSE, 'Daily Open Hours', '10000000-0000-0000-0000-000000000002');

-- 5. Insert green_index_metrics
INSERT INTO green_index_metrics (place_id, total_score, canopy_cover_pct, park_density_sqm_per_capita, measured_data_source, estimate_method_note, confidence_level)
VALUES
    (
        '20000000-0000-0000-0000-000000000002',
        78.50,
        42.30,
        1.85,
        'Sentinel-2 NDVI Composite 2025 + NPDC Survey',
        NULL,
        'HIGH'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        91.20,
        84.60,
        0.45,
        'Sentinel-2 Open Earth Engine 10m NDVI & LGU GIS',
        'Canopy estimate derived from high-resolution Sentinel-2 multispectral band indices (NDVI threshold > 0.4).',
        'MEDIUM'
    );
