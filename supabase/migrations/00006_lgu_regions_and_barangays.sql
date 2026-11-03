-- Migration: 00006_lgu_regions_and_barangays.sql
-- F-M1-01: lgu_regions and barangays tables and seed 17 Metro Manila LGUs
-- (Manila, Quezon City, Caloocan, Las Piñas, Makati, Malabon, Mandaluyong,
--  Marikina, Muntinlupa, Navotas, Parañaque, Pasay, Pasig, San Juan,
--  Taguig, Valenzuela, Pateros)

-- 1. Create lgu_regions table
CREATE TABLE IF NOT EXISTS lgu_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(100) NOT NULL UNIQUE,
    region_code VARCHAR(20) NOT NULL DEFAULT 'NCR',
    province VARCHAR(100) NOT NULL DEFAULT 'Metro Manila',
    total_barangays INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_total_barangays_positive CHECK (total_barangays >= 0)
);

CREATE INDEX IF NOT EXISTS idx_lgu_regions_city_name ON lgu_regions(city_name);

-- 2. Create barangays table
CREATE TABLE IF NOT EXISTS barangays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lgu_id UUID NOT NULL REFERENCES lgu_regions(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    postal_code VARCHAR(10) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_lgu_barangay_name UNIQUE (city_name, name)
);

CREATE INDEX IF NOT EXISTS idx_barangays_lgu_id ON barangays(lgu_id);
CREATE INDEX IF NOT EXISTS idx_barangays_city_name ON barangays(city_name);
CREATE INDEX IF NOT EXISTS idx_barangays_name ON barangays(name);

-- 3. Seed 17 Metro Manila LGUs
INSERT INTO lgu_regions (id, city_name, region_code, province, total_barangays)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Caloocan', 'NCR', 'Metro Manila', 188),
    ('c0000000-0000-0000-0000-000000000002', 'Las Piñas', 'NCR', 'Metro Manila', 20),
    ('c0000000-0000-0000-0000-000000000003', 'Makati', 'NCR', 'Metro Manila', 33),
    ('c0000000-0000-0000-0000-000000000004', 'Malabon', 'NCR', 'Metro Manila', 21),
    ('c0000000-0000-0000-0000-000000000005', 'Mandaluyong', 'NCR', 'Metro Manila', 27),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'NCR', 'Metro Manila', 897),
    ('c0000000-0000-0000-0000-000000000007', 'Marikina', 'NCR', 'Metro Manila', 16),
    ('c0000000-0000-0000-0000-000000000008', 'Muntinlupa', 'NCR', 'Metro Manila', 9),
    ('c0000000-0000-0000-0000-000000000009', 'Navotas', 'NCR', 'Metro Manila', 18),
    ('c0000000-0000-0000-0000-000000000010', 'Parañaque', 'NCR', 'Metro Manila', 16),
    ('c0000000-0000-0000-0000-000000000011', 'Pasay', 'NCR', 'Metro Manila', 201),
    ('c0000000-0000-0000-0000-000000000012', 'Pasig', 'NCR', 'Metro Manila', 30),
    ('c0000000-0000-0000-0000-000000000013', 'Pateros', 'NCR', 'Metro Manila', 10),
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'NCR', 'Metro Manila', 142),
    ('c0000000-0000-0000-0000-000000000015', 'San Juan', 'NCR', 'Metro Manila', 21),
    ('c0000000-0000-0000-0000-000000000016', 'Taguig', 'NCR', 'Metro Manila', 38),
    ('c0000000-0000-0000-0000-000000000017', 'Valenzuela', 'NCR', 'Metro Manila', 33)
ON CONFLICT (city_name) DO UPDATE SET
    total_barangays = EXCLUDED.total_barangays,
    updated_at = NOW();

-- 4. Seed verified barangays across all 17 LGUs
INSERT INTO barangays (lgu_id, city_name, name)
VALUES
    -- Caloocan
    ('c0000000-0000-0000-0000-000000000001', 'Caloocan', 'Barangay 1'),
    ('c0000000-0000-0000-0000-000000000001', 'Caloocan', 'Barangay 2'),
    ('c0000000-0000-0000-0000-000000000001', 'Caloocan', 'Bagong Silang'),
    ('c0000000-0000-0000-0000-000000000001', 'Caloocan', 'Morning Breeze'),
    ('c0000000-0000-0000-0000-000000000001', 'Caloocan', 'Grace Park West'),
    -- Las Piñas
    ('c0000000-0000-0000-0000-000000000002', 'Las Piñas', 'Almanza Uno'),
    ('c0000000-0000-0000-0000-000000000002', 'Las Piñas', 'Pamplona Uno'),
    ('c0000000-0000-0000-0000-000000000002', 'Las Piñas', 'Talon Uno'),
    ('c0000000-0000-0000-0000-000000000002', 'Las Piñas', 'Pulang Lupa Uno'),
    ('c0000000-0000-0000-0000-000000000002', 'Las Piñas', 'Zapote'),
    -- Makati
    ('c0000000-0000-0000-0000-000000000003', 'Makati', 'Bel-Air'),
    ('c0000000-0000-0000-0000-000000000003', 'Makati', 'Poblacion'),
    ('c0000000-0000-0000-0000-000000000003', 'Makati', 'San Lorenzo'),
    ('c0000000-0000-0000-0000-000000000003', 'Makati', 'Legazpi Village'),
    ('c0000000-0000-0000-0000-000000000003', 'Makati', 'Urdaneta'),
    -- Malabon
    ('c0000000-0000-0000-0000-000000000004', 'Malabon', 'Catmon'),
    ('c0000000-0000-0000-0000-000000000004', 'Malabon', 'Concepcion'),
    ('c0000000-0000-0000-0000-000000000004', 'Malabon', 'Potrero'),
    ('c0000000-0000-0000-0000-000000000004', 'Malabon', 'Tonsuya'),
    ('c0000000-0000-0000-0000-000000000004', 'Malabon', 'Longos'),
    -- Mandaluyong
    ('c0000000-0000-0000-0000-000000000005', 'Mandaluyong', 'Highway Hills'),
    ('c0000000-0000-0000-0000-000000000005', 'Mandaluyong', 'Plainview'),
    ('c0000000-0000-0000-0000-000000000005', 'Mandaluyong', 'Wack-Wack Greenhills'),
    ('c0000000-0000-0000-0000-000000000005', 'Mandaluyong', 'Barangka Ilaya'),
    ('c0000000-0000-0000-0000-000000000005', 'Mandaluyong', 'Hulo'),
    -- Manila
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Barangay 659'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Barangay 659-A'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Barangay 660'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Barangay 666'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Intramuros'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Ermita'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Malate'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Paco'),
    ('c0000000-0000-0000-0000-000000000006', 'Manila', 'Santa Cruz'),
    -- Marikina
    ('c0000000-0000-0000-0000-000000000007', 'Marikina', 'Concepcion Uno'),
    ('c0000000-0000-0000-0000-000000000007', 'Marikina', 'Concepcion Dos'),
    ('c0000000-0000-0000-0000-000000000007', 'Marikina', 'Marikina Heights'),
    ('c0000000-0000-0000-0000-000000000007', 'Marikina', 'Santo Niño'),
    ('c0000000-0000-0000-0000-000000000007', 'Marikina', 'Santa Elena'),
    -- Muntinlupa
    ('c0000000-0000-0000-0000-000000000008', 'Muntinlupa', 'Alabang'),
    ('c0000000-0000-0000-0000-000000000008', 'Muntinlupa', 'Ayala Alabang'),
    ('c0000000-0000-0000-0000-000000000008', 'Muntinlupa', 'Putatan'),
    ('c0000000-0000-0000-0000-000000000008', 'Muntinlupa', 'Poblacion'),
    ('c0000000-0000-0000-0000-000000000008', 'Muntinlupa', 'Bayanan'),
    -- Navotas
    ('c0000000-0000-0000-0000-000000000009', 'Navotas', 'Bagumbayan South'),
    ('c0000000-0000-0000-0000-000000000009', 'Navotas', 'San Jose'),
    ('c0000000-0000-0000-0000-000000000009', 'Navotas', 'Tangos South'),
    ('c0000000-0000-0000-0000-000000000009', 'Navotas', 'Daanghari'),
    ('c0000000-0000-0000-0000-000000000009', 'Navotas', 'North Bay Boulevard South'),
    -- Parañaque
    ('c0000000-0000-0000-0000-000000000010', 'Parañaque', 'Baclaran'),
    ('c0000000-0000-0000-0000-000000000010', 'Parañaque', 'BF Homes'),
    ('c0000000-0000-0000-0000-000000000010', 'Parañaque', 'Don Bosco'),
    ('c0000000-0000-0000-0000-000000000010', 'Parañaque', 'San Antonio'),
    ('c0000000-0000-0000-0000-000000000010', 'Parañaque', 'Sun Valley'),
    -- Pasay
    ('c0000000-0000-0000-0000-000000000011', 'Pasay', 'Barangay 1'),
    ('c0000000-0000-0000-0000-000000000011', 'Pasay', 'Barangay 76'),
    ('c0000000-0000-0000-0000-000000000011', 'Pasay', 'San Rafael'),
    ('c0000000-0000-0000-0000-000000000011', 'Pasay', 'San Isidro'),
    ('c0000000-0000-0000-0000-000000000011', 'Pasay', 'Pia'),
    -- Pasig
    ('c0000000-0000-0000-0000-000000000012', 'Pasig', 'San Antonio'),
    ('c0000000-0000-0000-0000-000000000012', 'Pasig', 'Kapitolyo'),
    ('c0000000-0000-0000-0000-000000000012', 'Pasig', 'Ugong'),
    ('c0000000-0000-0000-0000-000000000012', 'Pasig', 'Oranbo'),
    ('c0000000-0000-0000-0000-000000000012', 'Pasig', 'Caniogan'),
    -- Pateros
    ('c0000000-0000-0000-0000-000000000013', 'Pateros', 'Aguho'),
    ('c0000000-0000-0000-0000-000000000013', 'Pateros', 'Martirez del 96'),
    ('c0000000-0000-0000-0000-000000000013', 'Pateros', 'Santa Ana'),
    ('c0000000-0000-0000-0000-000000000013', 'Pateros', 'Poblacion'),
    ('c0000000-0000-0000-0000-000000000013', 'Pateros', 'San Pedro'),
    -- Quezon City
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'Central'),
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'Diliman'),
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'Loyola Heights'),
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'Batasan Hills'),
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'Pinyahan'),
    ('c0000000-0000-0000-0000-000000000014', 'Quezon City', 'UP Campus'),
    -- San Juan
    ('c0000000-0000-0000-0000-000000000015', 'San Juan', 'Greenhills'),
    ('c0000000-0000-0000-0000-000000000015', 'San Juan', 'Addition Hills'),
    ('c0000000-0000-0000-0000-000000000015', 'San Juan', 'Little Baguio'),
    ('c0000000-0000-0000-0000-000000000015', 'San Juan', 'Corazon de Jesus'),
    ('c0000000-0000-0000-0000-000000000015', 'San Juan', 'West Crame'),
    -- Taguig
    ('c0000000-0000-0000-0000-000000000016', 'Taguig', 'Fort Bonifacio'),
    ('c0000000-0000-0000-0000-000000000016', 'Taguig', 'Ususan'),
    ('c0000000-0000-0000-0000-000000000016', 'Taguig', 'Western Bicutan'),
    ('c0000000-0000-0000-0000-000000000016', 'Taguig', 'Pinagsama'),
    ('c0000000-0000-0000-0000-000000000016', 'Taguig', 'Lower Bicutan'),
    -- Valenzuela
    ('c0000000-0000-0000-0000-000000000017', 'Valenzuela', 'Gen. T. de Leon'),
    ('c0000000-0000-0000-0000-000000000017', 'Valenzuela', 'Karuhatan'),
    ('c0000000-0000-0000-0000-000000000017', 'Valenzuela', 'Poblacion'),
    ('c0000000-0000-0000-0000-000000000017', 'Valenzuela', 'Malanday'),
    ('c0000000-0000-0000-0000-000000000017', 'Valenzuela', 'Marulas')
ON CONFLICT (city_name, name) DO NOTHING;
