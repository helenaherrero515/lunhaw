-- Migration: 00011_seed_transit_network.sql
-- F-M2-02: Seed MRT-3, LRT-1, LRT-2 station nodes, EDSA Busway stops, and major jeepney routes
-- with official LTFRB and rail fare baselines.
-- Traces back to: F-003, INV-001, EQ-002, EQ-003, EQ-004, DS-001, DS-003

BEGIN;

-- 1. Insert Verification Metadata for Transit & Fare Data
INSERT INTO verification_meta (id, status, official_source_name, official_source_url, derivation_note, last_verified_at, verified_by)
VALUES
    (
        'v0020000-0000-0000-0000-000000000001',
        'VERIFIED',
        'Land Transportation Franchising and Regulatory Board (LTFRB)',
        'https://ltfrb.gov.ph',
        NULL,
        '2026-10-15T00:00:00Z',
        'ltfrb_fare_auditor'
    ),
    (
        'v0020000-0000-0000-0000-000000000002',
        'VERIFIED',
        'Light Rail Manila Corporation (LRMC) & DOTr LRT-1',
        'https://www.lrmc.ph',
        NULL,
        '2026-10-15T00:00:00Z',
        'dotr_rail_regulatory'
    ),
    (
        'v0020000-0000-0000-0000-000000000003',
        'VERIFIED',
        'Department of Transportation (DOTr) MRT-3 Operations',
        'https://dotrmrt3.gov.ph',
        NULL,
        '2026-10-15T00:00:00Z',
        'mrt3_transit_auditor'
    ),
    (
        'v0020000-0000-0000-0000-000000000004',
        'VERIFIED',
        'Light Rail Transit Authority (LRTA) LRT-2',
        'https://www.lrta.gov.ph',
        NULL,
        '2026-10-15T00:00:00Z',
        'lrta_compliance_team'
    ),
    (
        'v0020000-0000-0000-0000-000000000005',
        'VERIFIED',
        'DOTr & MMDA EDSA Carousel Busway Network',
        'https://dotr.gov.ph',
        NULL,
        '2026-10-15T00:00:00Z',
        'dotr_busway_inspector'
    ),
    (
        'v0020000-0000-0000-0000-000000000006',
        'ESTIMATE',
        'LTFRB Memorandum Circular Fare Matrix & OpenStreetMap',
        'https://ltfrb.gov.ph',
        'Jeepney fare calculated via EQ-004: Base 13.00 PHP (first 4 km), 1.80 PHP/km thereafter from OSM route geometry.',
        '2026-10-15T00:00:00Z',
        'ltfrb_route_estimator'
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Transit Stops (MRT-3, LRT-1, LRT-2, EDSA Busway, Major Jeepney Nodes)

-- 2A. MRT-3 Stations (13 stations along EDSA corridor)
INSERT INTO transit_stops (id, name, code, transit_mode, line_name, lgu_city, coordinates, wheelchair_accessible, verification_id)
VALUES
    ('s0010000-0000-0000-0000-000000000001', 'North Avenue', 'MRT3-NOA', 'lrt_mrt', 'MRT-3', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0336, 14.6522), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000002', 'Quezon Avenue', 'MRT3-QAV', 'lrt_mrt', 'MRT-3', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0385, 14.6429), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000003', 'GMA-Kamuning', 'MRT3-KAM', 'lrt_mrt', 'MRT-3', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0435, 14.6353), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000004', 'Araneta Center-Cubao (MRT-3)', 'MRT3-CUB', 'lrt_mrt', 'MRT-3', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0528, 14.6195), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000005', 'Santolan-Annapolis', 'MRT3-SAN', 'lrt_mrt', 'MRT-3', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0567, 14.6078), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000006', 'Ortigas', 'MRT3-ORT', 'lrt_mrt', 'MRT-3', 'Mandaluyong', ST_SetSRID(ST_MakePoint(121.0587, 14.5878), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000007', 'Shaw Boulevard', 'MRT3-SHA', 'lrt_mrt', 'MRT-3', 'Mandaluyong', ST_SetSRID(ST_MakePoint(121.0537, 14.5812), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000008', 'Boni', 'MRT3-BON', 'lrt_mrt', 'MRT-3', 'Mandaluyong', ST_SetSRID(ST_MakePoint(121.0463, 14.5739), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000009', 'Guadalupe', 'MRT3-GUA', 'lrt_mrt', 'MRT-3', 'Makati', ST_SetSRID(ST_MakePoint(121.0410, 14.5672), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000010', 'Buendia', 'MRT3-BUE', 'lrt_mrt', 'MRT-3', 'Makati', ST_SetSRID(ST_MakePoint(121.0328, 14.5542), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000011', 'Ayala', 'MRT3-AYA', 'lrt_mrt', 'MRT-3', 'Makati', ST_SetSRID(ST_MakePoint(121.0280, 14.5492), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000012', 'Magallanes', 'MRT3-MAG', 'lrt_mrt', 'MRT-3', 'Makati', ST_SetSRID(ST_MakePoint(121.0198, 14.5420), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),
    ('s0010000-0000-0000-0000-000000000013', 'Taft Avenue', 'MRT3-TAF', 'lrt_mrt', 'MRT-3', 'Pasay', ST_SetSRID(ST_MakePoint(121.0006, 14.5376), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000003'),

-- 2B. LRT-1 Stations (17 key stations)
    ('s0010000-0000-0000-0000-000000000020', 'Fernando Poe Jr. (Roosevelt)', 'LRT1-FPJ', 'lrt_mrt', 'LRT-1', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0210, 14.6575), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000021', 'Balintawak', 'LRT1-BAL', 'lrt_mrt', 'LRT-1', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0039, 14.6574), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000022', 'Monumento', 'LRT1-MON', 'lrt_mrt', 'LRT-1', 'Caloocan', ST_SetSRID(ST_MakePoint(120.9837, 14.6543), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000023', '5th Avenue', 'LRT1-5TH', 'lrt_mrt', 'LRT-1', 'Caloocan', ST_SetSRID(ST_MakePoint(120.9835, 14.6444), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000024', 'Blumentritt', 'LRT1-BLU', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9830, 14.6226), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000025', 'Tayuman', 'LRT1-TAY', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9829, 14.6167), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000026', 'Doroteo Jose', 'LRT1-DJO', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9818, 14.6053), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000027', 'Carriedo', 'LRT1-CAR', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9814, 14.5997), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000028', 'Central Terminal', 'LRT1-CEN', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9819, 14.5928), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000029', 'United Nations', 'LRT1-UNA', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9837, 14.5826), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000030', 'Pedro Gil', 'LRT1-PGI', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9882, 14.5765), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000031', 'Quirino', 'LRT1-QUI', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9918, 14.5701), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000032', 'Vito Cruz', 'LRT1-VCR', 'lrt_mrt', 'LRT-1', 'Manila', ST_SetSRID(ST_MakePoint(120.9946, 14.5638), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000033', 'Gil Puyat (Buendia)', 'LRT1-GPU', 'lrt_mrt', 'LRT-1', 'Pasay', ST_SetSRID(ST_MakePoint(120.9972, 14.5541), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000034', 'Libertad', 'LRT1-LIB', 'lrt_mrt', 'LRT-1', 'Pasay', ST_SetSRID(ST_MakePoint(120.9984, 14.5477), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000035', 'EDSA (LRT-1)', 'LRT1-EDS', 'lrt_mrt', 'LRT-1', 'Pasay', ST_SetSRID(ST_MakePoint(121.0003, 14.5388), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),
    ('s0010000-0000-0000-0000-000000000036', 'Baclaran', 'LRT1-BAC', 'lrt_mrt', 'LRT-1', 'Pasay', ST_SetSRID(ST_MakePoint(120.9983, 14.5342), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000002'),

-- 2C. LRT-2 Stations (13 stations Recto to Antipolo)
    ('s0010000-0000-0000-0000-000000000040', 'Recto', 'LRT2-REC', 'lrt_mrt', 'LRT-2', 'Manila', ST_SetSRID(ST_MakePoint(120.9840, 14.6036), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000041', 'Legarda', 'LRT2-LEG', 'lrt_mrt', 'LRT-2', 'Manila', ST_SetSRID(ST_MakePoint(120.9926, 14.6008), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000042', 'Pureza', 'LRT2-PUR', 'lrt_mrt', 'LRT-2', 'Manila', ST_SetSRID(ST_MakePoint(121.0051, 14.6015), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000043', 'V. Mapa', 'LRT2-VMA', 'lrt_mrt', 'LRT-2', 'Manila', ST_SetSRID(ST_MakePoint(121.0175, 14.6041), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000044', 'J. Ruiz', 'LRT2-JRU', 'lrt_mrt', 'LRT-2', 'San Juan', ST_SetSRID(ST_MakePoint(121.0261, 14.6053), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000045', 'Gilmore', 'LRT2-GIL', 'lrt_mrt', 'LRT-2', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0345, 14.6135), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000046', 'Betty Go-Belmonte', 'LRT2-BGB', 'lrt_mrt', 'LRT-2', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0427, 14.6186), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000047', 'Araneta Center-Cubao (LRT-2)', 'LRT2-CUB', 'lrt_mrt', 'LRT-2', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0531, 14.6226), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000048', 'Anonas', 'LRT2-ANO', 'lrt_mrt', 'LRT-2', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0647, 14.6280), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000049', 'Katipunan', 'LRT2-KAT', 'lrt_mrt', 'LRT-2', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0728, 14.6310), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000050', 'Santolan (LRT-2)', 'LRT2-SAN', 'lrt_mrt', 'LRT-2', 'Pasig', ST_SetSRID(ST_MakePoint(121.0858, 14.6221), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000051', 'Marikina-Pasig', 'LRT2-MAR', 'lrt_mrt', 'LRT-2', 'Marikina', ST_SetSRID(ST_MakePoint(121.1011, 14.6237), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),
    ('s0010000-0000-0000-0000-000000000052', 'Antipolo', 'LRT2-ANT', 'lrt_mrt', 'LRT-2', 'Pasig', ST_SetSRID(ST_MakePoint(121.1215, 14.6247), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000004'),

-- 2D. EDSA Busway / Carousel Stops (13 key stops)
    ('s0010000-0000-0000-0000-000000000060', 'Monumento Busway Stop', 'BSW-MON', 'bus', 'EDSA Busway', 'Caloocan', ST_SetSRID(ST_MakePoint(120.9839, 14.6545), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000061', 'Bagong Barrio Busway Stop', 'BSW-BGB', 'bus', 'EDSA Busway', 'Caloocan', ST_SetSRID(ST_MakePoint(120.9992, 14.6570), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000062', 'North Avenue Busway Stop', 'BSW-NOA', 'bus', 'EDSA Busway', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0338, 14.6525), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000063', 'Quezon Avenue Busway Stop', 'BSW-QAV', 'bus', 'EDSA Busway', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0387, 14.6432), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000064', 'Main Avenue Cubao Busway Stop', 'BSW-MAC', 'bus', 'EDSA Busway', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0532, 14.6156), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000065', 'Santolan Busway Stop', 'BSW-SAN', 'bus', 'EDSA Busway', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0569, 14.6080), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000066', 'Ortigas Busway Stop', 'BSW-ORT', 'bus', 'EDSA Busway', 'Mandaluyong', ST_SetSRID(ST_MakePoint(121.0589, 14.5880), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000067', 'Guadalupe Busway Stop', 'BSW-GUA', 'bus', 'EDSA Busway', 'Makati', ST_SetSRID(ST_MakePoint(121.0412, 14.5675), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000068', 'Buendia Busway Stop', 'BSW-BUE', 'bus', 'EDSA Busway', 'Makati', ST_SetSRID(ST_MakePoint(121.0330, 14.5545), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000069', 'One Ayala Busway Station', 'BSW-OAY', 'bus', 'EDSA Busway', 'Makati', ST_SetSRID(ST_MakePoint(121.0282, 14.5495), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000070', 'Tramo Busway Stop', 'BSW-TRA', 'bus', 'EDSA Busway', 'Pasay', ST_SetSRID(ST_MakePoint(121.0020, 14.5385), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000071', 'Roxas Boulevard Busway Stop', 'BSW-ROX', 'bus', 'EDSA Busway', 'Pasay', ST_SetSRID(ST_MakePoint(120.9902, 14.5348), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),
    ('s0010000-0000-0000-0000-000000000072', 'PITX Bus Terminal', 'BSW-PITX', 'bus', 'EDSA Busway', 'Parañaque', ST_SetSRID(ST_MakePoint(120.9912, 14.5098), 4326)::geography, TRUE, 'v0020000-0000-0000-0000-000000000005'),

-- 2E. Major Jeepney Stops / Corridors
    ('s0010000-0000-0000-0000-000000000080', 'Quiapo Church Plaza Miranda Terminal', 'JEP-QPO', 'jeepney', 'Quiapo Jeepney Network', 'Manila', ST_SetSRID(ST_MakePoint(120.9849, 14.5986), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000081', 'España Blvd - UST Overpass', 'JEP-UST', 'jeepney', 'España-Quezon Ave Corridor', 'Manila', ST_SetSRID(ST_MakePoint(120.9895, 14.6095), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000082', 'Welcome Rotonda (Mabuhay Rotonda)', 'JEP-WLC', 'jeepney', 'España-Quezon Ave Corridor', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0016, 14.6198), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000083', 'Philcoa / Diliman Terminal', 'JEP-PHL', 'jeepney', 'Commonwealth Corridor', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0535, 14.6538), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000084', 'UP Diliman Academic Oval', 'JEP-UPD', 'jeepney', 'UP Campus Ikot Network', 'Quezon City', ST_SetSRID(ST_MakePoint(121.0685, 14.6538), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000085', 'Taft Ave - PGH / Pedro Gil', 'JEP-PGH', 'jeepney', 'Taft Avenue Corridor', 'Manila', ST_SetSRID(ST_MakePoint(120.9885, 14.5768), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000086', 'Buendia - LRT Gil Puyat Terminal', 'JEP-GPU', 'jeepney', 'Buendia-Ayala Corridor', 'Pasay', ST_SetSRID(ST_MakePoint(120.9975, 14.5545), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001'),
    ('s0010000-0000-0000-0000-000000000087', 'Ayala Ave - Washington / Chino Roces', 'JEP-WSH', 'jeepney', 'Ayala Washington Network', 'Makati', ST_SetSRID(ST_MakePoint(121.0118, 14.5578), 4326)::geography, FALSE, 'v0020000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Major Transit Routes
INSERT INTO transit_routes (id, route_code, name, origin_name, destination_name, transit_mode, total_distance_meters, est_duration_seconds, base_fare_php, fare_per_km_php, path_geometry, path_geometry_geojson, fare_verification_id)
VALUES
    -- 3A. MRT-3 Full Line
    (
        'r0010000-0000-0000-0000-000000000001',
        'MRT3-FULL',
        'MRT-3 (North Ave - Taft Ave)',
        'North Avenue Station',
        'Taft Avenue Station',
        'lrt_mrt',
        16900.00,
        2100, -- 35 mins
        13.00,
        1.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0336 14.6522, 121.0385 14.6429, 121.0435 14.6353, 121.0528 14.6195, 121.0567 14.6078, 121.0587 14.5878, 121.0537 14.5812, 121.0463 14.5739, 121.0410 14.5672, 121.0328 14.5542, 121.0280 14.5492, 121.0198 14.5420, 121.0006 14.5376)'), 4326),
        '{"type":"LineString","coordinates":[[121.0336,14.6522],[121.0385,14.6429],[121.0435,14.6353],[121.0528,14.6195],[121.0567,14.6078],[121.0587,14.5878],[121.0537,14.5812],[121.0463,14.5739],[121.0410,14.5672],[121.0328,14.5542],[121.0280,14.5492],[121.0198,14.5420],[121.0006,14.5376]]}'::jsonb,
        'v0020000-0000-0000-0000-000000000003'
    ),

    -- 3B. LRT-1 Full Line
    (
        'r0010000-0000-0000-0000-000000000002',
        'LRT1-FULL',
        'LRT-1 (FPJ Roosevelt - Baclaran)',
        'Fernando Poe Jr. Station',
        'Baclaran Station',
        'lrt_mrt',
        19650.00,
        2400, -- 40 mins
        15.00,
        1.20,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0210 14.6575, 121.0039 14.6574, 120.9837 14.6543, 120.9830 14.6226, 120.9818 14.6053, 120.9819 14.5928, 120.9837 14.5826, 120.9882 14.5765, 120.9972 14.5541, 121.0003 14.5388, 120.9983 14.5342)'), 4326),
        '{"type":"LineString","coordinates":[[121.0210,14.6575],[121.0039,14.6574],[120.9837,14.6543],[120.9830,14.6226],[120.9818,14.6053],[120.9819,14.5928],[120.9837,14.5826],[120.9882,14.5765],[120.9972,14.5541],[121.0003,14.5388],[120.9983,14.5342]]}'::jsonb,
        'v0020000-0000-0000-0000-000000000002'
    ),

    -- 3C. LRT-2 Full Line
    (
        'r0010000-0000-0000-0000-000000000003',
        'LRT2-FULL',
        'LRT-2 (Recto - Antipolo)',
        'Recto Station',
        'Antipolo Station',
        'lrt_mrt',
        17600.00,
        2040, -- 34 mins
        15.00,
        1.10,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9840 14.6036, 120.9926 14.6008, 121.0051 14.6015, 121.0261 14.6053, 121.0531 14.6226, 121.0728 14.6310, 121.0858 14.6221, 121.1011 14.6237, 121.1215 14.6247)'), 4326),
        '{"type":"LineString","coordinates":[[120.9840,14.6036],[120.9926,14.6008],[121.0051,14.6015],[121.0261,14.6053],[121.0531,14.6226],[121.0728,14.6310],[121.0858,14.6221],[121.1011,14.6237],[121.1215,14.6247]]}'::jsonb,
        'v0020000-0000-0000-0000-000000000004'
    ),

    -- 3D. EDSA Carousel Busway
    (
        'r0010000-0000-0000-0000-000000000004',
        'BUS-EDSA-CAROUSEL',
        'EDSA Carousel Busway (Monumento - PITX)',
        'Monumento Busway Stop',
        'PITX Bus Terminal',
        'bus',
        28100.00,
        4200, -- 70 mins
        15.00,
        2.65,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9839 14.6545, 121.0338 14.6525, 121.0387 14.6432, 121.0532 14.6156, 121.0589 14.5880, 121.0412 14.5675, 121.0282 14.5495, 120.9902 14.5348, 120.9912 14.5098)'), 4326),
        '{"type":"LineString","coordinates":[[120.9839,14.6545],[121.0338,14.6525],[121.0387,14.6432],[121.0532,14.6156],[121.0589,14.5880],[121.0412,14.5675],[121.0282,14.5495],[120.9902,14.5348],[120.9912,14.5098]]}'::jsonb,
        'v0020000-0000-0000-0000-000000000005'
    ),

    -- 3E. Major Jeepney Route: Quiapo - Philcoa / UP Diliman via España & Quezon Ave
    (
        'r0010000-0000-0000-0000-000000000005',
        'JEEP-QUIAPO-DILIMAN',
        'Quiapo - Philcoa / UP Diliman via España',
        'Quiapo Church Plaza Miranda',
        'Philcoa / Diliman Terminal',
        'jeepney',
        11200.00,
        2400, -- 40 mins
        13.00,
        1.80,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9849 14.5986, 120.9895 14.6095, 121.0016 14.6198, 121.0385 14.6429, 121.0535 14.6538)'), 4326),
        '{"type":"LineString","coordinates":[[120.9849,14.5986],[120.9895,14.6095],[121.0016,14.6198],[121.0385,14.6429],[121.0535,14.6538]]}'::jsonb,
        'v0020000-0000-0000-0000-000000000006'
    ),

    -- 3F. Major Jeepney Route: Buendia LRT - Ayala Ave - Guadalupe
    (
        'r0010000-0000-0000-0000-000000000006',
        'JEEP-BUENDIA-AYALA',
        'Buendia LRT - Ayala Ave - Guadalupe',
        'Buendia - LRT Gil Puyat Terminal',
        'Guadalupe Station Plaza',
        'jeepney',
        6200.00,
        1500, -- 25 mins
        13.00,
        1.80,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9975 14.5545, 121.0118 14.5578, 121.0242 14.5574, 121.0280 14.5492, 121.0410 14.5672)'), 4326),
        '{"type":"LineString","coordinates":[[120.9975,14.5545],[121.0118,14.5578],[121.0242,14.5574],[121.0280,14.5492],[121.0410,14.5672]]}'::jsonb,
        'v0020000-0000-0000-0000-000000000006'
    )
ON CONFLICT (route_code) DO NOTHING;

-- 4. Seed Route Legs (Detailed segment sequence with walking, boarding, riding, and canopy shade)
INSERT INTO route_legs (id, route_id, sequence_order, leg_mode, instruction, from_stop_id, to_stop_id, leg_distance_meters, leg_duration_seconds, shade_coverage_pct, path_geometry, leg_verification_id)
VALUES
    -- Legs for MRT-3 Full Line (Route r0010000-0000-0000-0000-000000000001)
    (
        'l0010000-0000-0000-0000-000000000001',
        'r0010000-0000-0000-0000-000000000001',
        1,
        'transit_board',
        'Board MRT-3 Southbound Train at North Avenue Station concourse.',
        's0010000-0000-0000-0000-000000000001',
        's0010000-0000-0000-0000-000000000001',
        50.00,
        180,
        100.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0336 14.6522, 121.0336 14.6522)'), 4326),
        'v0020000-0000-0000-0000-000000000003'
    ),
    (
        'l0010000-0000-0000-0000-000000000002',
        'r0010000-0000-0000-0000-000000000001',
        2,
        'transit_ride',
        'Ride MRT-3 Southbound from North Avenue to Araneta Center-Cubao (3 stations, 3.8 km).',
        's0010000-0000-0000-0000-000000000001',
        's0010000-0000-0000-0000-000000000004',
        3800.00,
        480,
        0.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0336 14.6522, 121.0385 14.6429, 121.0435 14.6353, 121.0528 14.6195)'), 4326),
        'v0020000-0000-0000-0000-000000000003'
    ),
    (
        'l0010000-0000-0000-0000-000000000003',
        'r0010000-0000-0000-0000-000000000001',
        3,
        'transit_ride',
        'Continue Southbound past Ortigas, Shaw, and Boni to Ayala Station (7 stations, 8.4 km).',
        's0010000-0000-0000-0000-000000000004',
        's0010000-0000-0000-0000-000000000011',
        8400.00,
        960,
        0.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0528 14.6195, 121.0567 14.6078, 121.0587 14.5878, 121.0537 14.5812, 121.0463 14.5739, 121.0410 14.5672, 121.0328 14.5542, 121.0280 14.5492)'), 4326),
        'v0020000-0000-0000-0000-000000000003'
    ),
    (
        'l0010000-0000-0000-0000-000000000004',
        'r0010000-0000-0000-0000-000000000001',
        4,
        'transit_ride',
        'Complete final leg south from Ayala to Taft Avenue Terminal Station (2 stations, 4.7 km).',
        's0010000-0000-0000-0000-000000000011',
        's0010000-0000-0000-0000-000000000013',
        4700.00,
        480,
        0.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0280 14.5492, 121.0198 14.5420, 121.0006 14.5376)'), 4326),
        'v0020000-0000-0000-0000-000000000003'
    ),

    -- Legs for LRT-1 Full Line (Route r0010000-0000-0000-0000-000000000002)
    (
        'l0010000-0000-0000-0000-000000000010',
        'r0010000-0000-0000-0000-000000000002',
        1,
        'transit_board',
        'Board LRT-1 Southbound train at FPJ (Roosevelt) Station platform.',
        's0010000-0000-0000-0000-000000000020',
        's0010000-0000-0000-0000-000000000020',
        40.00,
        150,
        100.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0210 14.6575, 121.0210 14.6575)'), 4326),
        'v0020000-0000-0000-0000-000000000002'
    ),
    (
        'l0010000-0000-0000-0000-000000000011',
        'r0010000-0000-0000-0000-000000000002',
        2,
        'transit_ride',
        'Ride LRT-1 Southbound from FPJ past Monumento and Doroteo Jose to Central Terminal (Manila City Hall / Arroceros Forest Park).',
        's0010000-0000-0000-0000-000000000020',
        's0010000-0000-0000-0000-000000000028',
        11200.00,
        1380,
        0.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(121.0210 14.6575, 121.0039 14.6574, 120.9837 14.6543, 120.9830 14.6226, 120.9818 14.6053, 120.9819 14.5928)'), 4326),
        'v0020000-0000-0000-0000-000000000002'
    ),
    (
        'l0010000-0000-0000-0000-000000000012',
        'r0010000-0000-0000-0000-000000000002',
        3,
        'transit_ride',
        'Continue Southbound past United Nations (Rizal Park) and Pedro Gil to Baclaran Terminal.',
        's0010000-0000-0000-0000-000000000028',
        's0010000-0000-0000-0000-000000000036',
        8450.00,
        1020,
        0.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9819 14.5928, 120.9837 14.5826, 120.9882 14.5765, 120.9972 14.5541, 121.0003 14.5388, 120.9983 14.5342)'), 4326),
        'v0020000-0000-0000-0000-000000000002'
    ),

    -- Legs for Quiapo - Philcoa Jeepney (Route r0010000-0000-0000-0000-000000000005)
    (
        'l0010000-0000-0000-0000-000000000020',
        'r0010000-0000-0000-0000-000000000005',
        1,
        'walk',
        'Walk through Plaza Miranda shaded pedestrian arcade towards Quezon Blvd loading zone.',
        's0010000-0000-0000-0000-000000000080',
        's0010000-0000-0000-0000-000000000080',
        180.00,
        154, -- ~14.3 mins/km via EQ-003
        72.50, -- Route shade via EQ-002
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9849 14.5986, 120.9855 14.5992)'), 4326),
        'v0020000-0000-0000-0000-000000000006'
    ),
    (
        'l0010000-0000-0000-0000-000000000021',
        'r0010000-0000-0000-0000-000000000005',
        2,
        'transit_board',
        'Board Traditional/Modern PUJ with sign: FAIRVIEW / PHILCOA / UP DILIMAN.',
        's0010000-0000-0000-0000-000000000080',
        's0010000-0000-0000-0000-000000000080',
        20.00,
        120,
        30.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9855 14.5992, 120.9855 14.5992)'), 4326),
        'v0020000-0000-0000-0000-000000000006'
    ),
    (
        'l0010000-0000-0000-0000-000000000022',
        'r0010000-0000-0000-0000-000000000005',
        3,
        'transit_ride',
        'Ride along España Boulevard past UST, Welcome Rotonda, and Quezon Avenue to Philcoa Terminal.',
        's0010000-0000-0000-0000-000000000080',
        's0010000-0000-0000-0000-000000000083',
        11000.00,
        2100,
        25.00,
        ST_SetSRID(ST_GeomFromText('LINESTRING(120.9849 14.5986, 120.9895 14.6095, 121.0016 14.6198, 121.0385 14.6429, 121.0535 14.6538)'), 4326),
        'v0020000-0000-0000-0000-000000000006'
    )
ON CONFLICT (id) DO NOTHING;

COMMIT;
