-- Migration: 00001_init_postgis.sql
-- F-M0-01: Enable PostGIS extension for spatial queries (SRID 4326)

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
