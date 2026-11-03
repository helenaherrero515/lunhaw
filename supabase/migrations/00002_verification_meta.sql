-- Migration: 00002_verification_meta.sql
-- F-M0-02: verification_meta table, enum status VERIFIED/ESTIMATE/NOT_AVAILABLE, check constraint chk_verification_derivation

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('VERIFIED', 'ESTIMATE', 'NOT_AVAILABLE');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS verification_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status verification_status NOT NULL,
    official_source_name VARCHAR(255) NULL,
    official_source_url VARCHAR(500) NULL,
    derivation_note TEXT NULL,
    last_verified_at TIMESTAMPTZ NULL,
    verified_by VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_verification_derivation CHECK (status != 'ESTIMATE' OR derivation_note IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_verification_meta_status ON verification_meta(status);
