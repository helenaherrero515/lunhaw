-- Migration: 00004_library_details.sql
-- F-M0-04: library_details and operating_hours tables with cascade rules and FKs to verification_meta

CREATE TABLE IF NOT EXISTS library_details (
    place_id UUID PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
    is_barangay_reading_center BOOLEAN NOT NULL DEFAULT FALSE,
    desk_capacity INTEGER NULL,
    has_power_outlets BOOLEAN NULL,
    has_wifi BOOLEAN NULL,
    has_aircon BOOLEAN NULL,
    access_requirements TEXT NULL,
    fee_description VARCHAR(100) NOT NULL DEFAULT 'Free',
    verification_id UUID NOT NULL REFERENCES verification_meta(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_desk_capacity_positive CHECK (desk_capacity IS NULL OR desk_capacity >= 0)
);

CREATE INDEX IF NOT EXISTS idx_library_details_verification_id ON library_details(verification_id);

CREATE TABLE IF NOT EXISTS operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL,
    open_time TIME NULL,
    close_time TIME NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_label VARCHAR(100) NULL,
    verification_id UUID NOT NULL REFERENCES verification_meta(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_day_of_week_range CHECK (day_of_week >= 0 AND day_of_week <= 6),
    CONSTRAINT chk_operating_hours_validity CHECK (
        is_closed = TRUE OR (open_time IS NOT NULL AND close_time IS NOT NULL AND open_time <= close_time)
    )
);

CREATE INDEX IF NOT EXISTS idx_operating_hours_place_day ON operating_hours(place_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_operating_hours_verification_id ON operating_hours(verification_id);
