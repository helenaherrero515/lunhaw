#!/usr/bin/env bash
# Applies every Supabase migration, in order, to an empty PostGIS database and checks the
# public-release invariants. Used locally and in CI.
#
#   DATABASE_URL=postgres://postgres:test@localhost:5432/postgres scripts/test-migrations.sh
#
# The database must be disposable: the script drops and recreates the public and auth schemas.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must point at a disposable PostGIS database}"
cd "$(dirname "$0")/../supabase/migrations"
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -X)

# Minimal stand-ins for what the Supabase platform provides (roles + auth.uid()).
"${PSQL[@]}" <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
DROP SCHEMA IF EXISTS auth CASCADE;
CREATE SCHEMA auth;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
SQL

for f in $(ls ./*.sql | sort); do
  echo "applying ${f#./}"
  "${PSQL[@]}" -f "$f"
done

check() { # description, SQL returning a single value, expected value
  local got
  got="$("${PSQL[@]}" -At -c "$2")"
  if [[ "$got" != "$3" ]]; then echo "FAIL: $1 (expected $3, got $got)"; exit 1; fi
  echo "ok: $1"
}

check "no record claims VERIFIED without a person confirming it" "SELECT count(*) FROM verification_meta WHERE status = 'VERIFIED'" 0
check "no unconfirmed opening hours are published" "SELECT count(*) FROM operating_hours" 0
check "no barangay reading centers are published" "SELECT count(*) FROM places WHERE category = 'reading_center'" 0
check "anonymous visitors can read the public places view" "SET ROLE anon; SELECT (count(*) > 0)::text FROM public_places" true
check "anonymous visitors cannot write places" \
  "DO \$\$ BEGIN SET LOCAL ROLE anon; INSERT INTO places (name, category, lgu_city, barangay, coordinates, verification_id) SELECT 'x', 'park', 'x', 'x', coordinates, verification_id FROM places LIMIT 1; RAISE EXCEPTION 'write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END \$\$; SELECT 'blocked'" blocked
check "anonymous visitors cannot read newsletter sign-ups" \
  "DO \$\$ BEGIN SET LOCAL ROLE anon; PERFORM count(*) FROM newsletter_signups; RAISE EXCEPTION 'read allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END \$\$; SELECT 'blocked'" blocked

echo "All migrations applied and release checks passed."
