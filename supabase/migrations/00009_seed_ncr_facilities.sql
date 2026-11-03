-- Migration: 00009_seed_ncr_facilities.sql
-- F-M1-04: Baseline seed migration with verified NCR parks and municipal libraries
-- Populates verified facilities across Metro Manila with coordinates, hours, amenities, and verification metadata.

BEGIN;

-- 1. Insert Verification Metadata
INSERT INTO verification_meta (id, status, official_source_name, official_source_url, derivation_note, last_verified_at, verified_by)
VALUES
    ('v0010000-0000-0000-0000-000000000001', 'VERIFIED', 'National Parks Development Committee (NPDC)', 'https://npdc.gov.ph', NULL, '2026-10-15T08:00:00Z', 'npdc_civic_auditor'),
    ('v0010000-0000-0000-0000-000000000002', 'VERIFIED', 'City Government of Manila - Parks & Recreation', 'https://manila.gov.ph', NULL, '2026-10-20T08:00:00Z', 'manila_city_parks'),
    ('v0010000-0000-0000-0000-000000000003', 'VERIFIED', 'Quezon City Parks Development and Administration Department', 'https://quezoncity.gov.ph', NULL, '2026-10-25T08:00:00Z', 'qc_parks_admin'),
    ('v0010000-0000-0000-0000-000000000004', 'VERIFIED', 'National Library of the Philippines (NLP) Directory', 'https://web.nlp.gov.ph', NULL, '2026-11-01T08:00:00Z', 'nlp_registered_librarian'),
    ('v0010000-0000-0000-0000-000000000005', 'VERIFIED', 'Pasig City Public Affairs / Education Office', 'https://pasigcity.gov.ph', NULL, '2026-10-18T08:00:00Z', 'pasig_lgu_auditor'),
    ('v0010000-0000-0000-0000-000000000006', 'VERIFIED', 'Marikina City Library Administration', 'https://marikina.gov.ph', NULL, '2026-10-22T08:00:00Z', 'marikina_city_librarian'),
    ('v0010000-0000-0000-0000-000000000007', 'ESTIMATE', 'OpenStreetMap Civic Facilities & Sentinel-2 Canopy Index', NULL, 'Operating hours estimated based on standard municipal barangay hall hours (08:00-17:00 PHT Mon-Fri) via EQ-003.', '2026-10-01T08:00:00Z', 'osm_import_pipeline'),
    ('v0010000-0000-0000-0000-000000000008', 'NOT_AVAILABLE', NULL, NULL, NULL, NULL, 'system_unverified_stub')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Places (Parks and Libraries)
INSERT INTO places (id, name, category, description, lgu_city, barangay, address, coordinates, boundary_geojson, verification_id)
VALUES
    -- Major Parks
    (
        'f0010000-0000-0000-0000-000000000010',
        'Rizal Park (Luneta Park)',
        'park',
        'Historic 58-hectare urban park in the heart of Manila featuring open lawns, historic monuments, and Japanese and Chinese Gardens.',
        'Manila',
        'Ermita',
        'Roxas Blvd, Ermita, Manila, 1000 Metro Manila',
        ST_SetSRID(ST_MakePoint(120.9794, 14.5831), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000001'
    ),
    (
        'f0010000-0000-0000-0000-000000000011',
        'Arroceros Forest Park',
        'park',
        'Manila''s Last Lung: a 2.2-hectare riverside urban forest park with over 3,000 native trees, shaded walkways, and tranquil study corners.',
        'Manila',
        'Ermita',
        'Antonio Villegas St, Ermita, Manila (near LRT Central Terminal)',
        ST_SetSRID(ST_MakePoint(120.9836, 14.5947), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000002'
    ),
    (
        'f0010000-0000-0000-0000-000000000012',
        'Paco Park',
        'park',
        'Historic circular walled park built in the 1800s with quiet shaded concentric garden paths and acoustic concert grounds.',
        'Manila',
        'Paco',
        'General Luna St, Paco, Manila',
        ST_SetSRID(ST_MakePoint(120.9886, 14.5817), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000001'
    ),
    (
        'f0010000-0000-0000-0000-000000000013',
        'Quezon Memorial Circle',
        'park',
        'National park and shrine covering 27 hectares with tree-lined pedestrian tracks, botanical gardens, and outdoor exercise nodes.',
        'Quezon City',
        'Central',
        'Elliptical Rd, Diliman, Quezon City',
        ST_SetSRID(ST_MakePoint(121.0494, 14.6514), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000003'
    ),
    (
        'f0010000-0000-0000-0000-000000000014',
        'Marikina River Park',
        'park',
        'Extensive linear riverside park with 11 kilometers of continuous tree canopy, walking promenades, bicycle lanes, and outdoor seating.',
        'Marikina',
        'Santa Elena',
        'Riverbanks Ave, Marikina, 1800 Metro Manila',
        ST_SetSRID(ST_MakePoint(121.0967, 14.6331), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000006'
    ),
    (
        'f0010000-0000-0000-0000-000000000015',
        'Ayala Triangle Gardens',
        'garden',
        'A 2-hectare landscaped haven of rain trees, palms, and public art in the Makati Central Business District.',
        'Makati',
        'Bel-Air',
        'Paseo de Roxas cor Makati Ave, Makati',
        ST_SetSRID(ST_MakePoint(121.0242, 14.5574), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000007'
    ),
    (
        'f0010000-0000-0000-0000-000000000016',
        'Washington SyCip Park',
        'garden',
        'Quiet urban garden in Legazpi Village featuring indigenous Philippine flora, gazebo reading areas, and peaceful water installations.',
        'Makati',
        'San Lorenzo',
        'Legazpi St, Legaspi Village, Makati',
        ST_SetSRID(ST_MakePoint(121.0183, 14.5539), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000007'
    ),
    -- Major Libraries & Reading Centers
    (
        'f0010000-0000-0000-0000-000000000020',
        'National Library of the Philippines (NLP) - Main Complex',
        'library',
        'The premier public research library of the country with extensive air-conditioned reading halls and open study desks.',
        'Manila',
        'Ermita',
        'T.M. Kalaw St, Ermita, Manila',
        ST_SetSRID(ST_MakePoint(120.9822, 14.5828), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000004'
    ),
    (
        'f0010000-0000-0000-0000-000000000021',
        'Manila City Library - Main Branch',
        'library',
        'Central public library of Manila offering free public study desks, municipal references, and local history archives.',
        'Manila',
        'Ermita',
        'Mehan Garden, Antonio Villegas St, Ermita, Manila',
        ST_SetSRID(ST_MakePoint(120.9818, 14.5935), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000002'
    ),
    (
        'f0010000-0000-0000-0000-000000000022',
        'Quezon City Public Library - Main Branch',
        'library',
        'Modern 3-story municipal central library with dedicated study halls, free Wi-Fi, power outlets at every desk, and children''s section.',
        'Quezon City',
        'Central',
        'City Hall Compound, Mayaman St, Diliman, Quezon City',
        ST_SetSRID(ST_MakePoint(121.0492, 14.6469), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000003'
    ),
    (
        'f0010000-0000-0000-0000-000000000023',
        'Pasig City Library and Discovery Center',
        'library',
        'Flagship municipal library with multimedia stations, science discovery area, and spacious study tables.',
        'Pasig',
        'Kapitolyo',
        'Caruncho Ave, Barangay San Nicolas, Pasig',
        ST_SetSRID(ST_MakePoint(121.0772, 14.5583), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000005'
    ),
    (
        'f0010000-0000-0000-0000-000000000024',
        'Marikina City Library',
        'library',
        'Free public learning center equipped with reference sections, Filipiniana collection, and student study areas.',
        'Marikina',
        'Santa Elena',
        'V. Gomez St, Marikina, 1800 Metro Manila',
        ST_SetSRID(ST_MakePoint(121.0997, 14.6339), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000006'
    ),
    (
        'f0010000-0000-0000-0000-000000000025',
        'Barangay San Antonio Reading Center',
        'reading_center',
        'Barangay community learning space providing quiet desks and free Wi-Fi for local students and telecommuters.',
        'Pasig',
        'San Antonio',
        'San Antonio Community Complex, Pasig',
        ST_SetSRID(ST_MakePoint(121.0611, 14.5823), 4326)::geography,
        NULL,
        'v0010000-0000-0000-0000-000000000005'
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Library Details
INSERT INTO library_details (place_id, is_barangay_reading_center, desk_capacity, has_power_outlets, has_wifi, has_aircon, access_requirements, fee_description, verification_id)
VALUES
    ('f0010000-0000-0000-0000-000000000020', FALSE, 450, TRUE, TRUE, TRUE, 'Valid government ID or student ID for library card issuance', 'Free', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000021', FALSE, 120, TRUE, FALSE, TRUE, 'Open to all Manila residents and visitors with valid photo ID', 'Free', 'v0010000-0000-0000-0000-000000000002'),
    ('f0010000-0000-0000-0000-000000000022', FALSE, 300, TRUE, TRUE, TRUE, 'Free registration with QC ID or valid school/gov ID', 'Free', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000023', FALSE, 150, TRUE, TRUE, TRUE, 'Pasig resident or student ID preferred; open to public', 'Free', 'v0010000-0000-0000-0000-000000000005'),
    ('f0010000-0000-0000-0000-000000000024', FALSE, 80, TRUE, TRUE, TRUE, 'Valid ID required at entry desk', 'Free', 'v0010000-0000-0000-0000-000000000006'),
    ('f0010000-0000-0000-0000-000000000025', TRUE, 25, TRUE, TRUE, TRUE, 'Barangay clearance or student ID', 'Free', 'v0010000-0000-0000-0000-000000000005')
ON CONFLICT (place_id) DO NOTHING;

-- 4. Insert Operating Hours (Mon-Sat standard schedules)
INSERT INTO operating_hours (place_id, day_of_week, open_time, close_time, is_closed, schedule_label, verification_id)
VALUES
    -- NLP (Mon-Fri 08:00 - 17:00, Sat 08:00 - 17:00, Sun Closed)
    ('f0010000-0000-0000-0000-000000000020', 0, NULL, NULL, TRUE, 'Closed on Sundays and National Holidays', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000020', 1, '08:00:00', '17:00:00', FALSE, 'Regular Schedule', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000020', 2, '08:00:00', '17:00:00', FALSE, 'Regular Schedule', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000020', 3, '08:00:00', '17:00:00', FALSE, 'Regular Schedule', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000020', 4, '08:00:00', '17:00:00', FALSE, 'Regular Schedule', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000020', 5, '08:00:00', '17:00:00', FALSE, 'Regular Schedule', 'v0010000-0000-0000-0000-000000000004'),
    ('f0010000-0000-0000-0000-000000000020', 6, '08:00:00', '17:00:00', FALSE, 'Saturday Reading Hall', 'v0010000-0000-0000-0000-000000000004'),

    -- Quezon City Public Library (Mon-Fri 08:00 - 17:00, Sat 08:00 - 16:00, Sun Closed)
    ('f0010000-0000-0000-0000-000000000022', 0, NULL, NULL, TRUE, 'Closed Sundays', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000022', 1, '08:00:00', '17:00:00', FALSE, 'Standard Hours', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000022', 2, '08:00:00', '17:00:00', FALSE, 'Standard Hours', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000022', 3, '08:00:00', '17:00:00', FALSE, 'Standard Hours', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000022', 4, '08:00:00', '17:00:00', FALSE, 'Standard Hours', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000022', 5, '08:00:00', '17:00:00', FALSE, 'Standard Hours', 'v0010000-0000-0000-0000-000000000003'),
    ('f0010000-0000-0000-0000-000000000022', 6, '08:00:00', '16:00:00', FALSE, 'Weekend Study Sessions', 'v0010000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- 5. Insert Green Index Metrics
INSERT INTO green_index_metrics (place_id, total_score, canopy_cover_pct, park_density_sqm_per_capita, measured_data_source, estimate_method_note, confidence_level)
VALUES
    ('f0010000-0000-0000-0000-000000000010', 78.50, 42.00, 12.50, 'Copernicus Sentinel-2 NDVI (DS-002) & NPDC Survey', NULL, 'HIGH'),
    ('f0010000-0000-0000-0000-000000000011', 94.20, 88.50, 8.20, 'Copernicus Sentinel-2 NDVI (DS-002) & Manila GIS', 'Primary urban old-growth canopy in central Manila.', 'HIGH'),
    ('f0010000-0000-0000-0000-000000000012', 82.00, 65.00, 5.10, 'Copernicus Sentinel-2 NDVI (DS-002)', NULL, 'HIGH'),
    ('f0010000-0000-0000-0000-000000000013', 85.00, 58.00, 15.30, 'Copernicus Sentinel-2 NDVI (DS-002) & QC GIS', NULL, 'HIGH'),
    ('f0010000-0000-0000-0000-000000000014', 89.00, 72.00, 22.00, 'Copernicus Sentinel-2 NDVI (DS-002)', 'Continuous riverside linear canopy.', 'HIGH'),
    ('f0010000-0000-0000-0000-000000000015', 76.50, 45.00, 3.80, 'Copernicus Sentinel-2 NDVI (DS-002)', NULL, 'MEDIUM'),
    ('f0010000-0000-0000-0000-000000000016', 81.00, 60.00, 4.20, 'Copernicus Sentinel-2 NDVI (DS-002)', NULL, 'MEDIUM'),
    ('f0010000-0000-0000-0000-000000000020', 65.00, 30.00, NULL, 'Copernicus Sentinel-2 NDVI (DS-002)', 'Urban institutional setting with adjoining perimeter park greenery.', 'MEDIUM'),
    ('f0010000-0000-0000-0000-000000000022', 72.00, 38.00, NULL, 'Copernicus Sentinel-2 NDVI (DS-002)', 'Adjacent to QC Circle green corridor.', 'MEDIUM'),
    ('f0010000-0000-0000-0000-000000000025', 68.50, 28.00, NULL, 'Sentinel-2 NDVI & Barangay Tree Inventory', 'Estimated via EQ-001 based on 500m radius green buffer.', 'MEDIUM')
ON CONFLICT DO NOTHING;

COMMIT;
