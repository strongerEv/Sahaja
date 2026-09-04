#!/usr/bin/env bash
# Menjalankan migrasi + test terhadap database Postgres lokal (bukan Supabase).
#
#   PGURL="postgres://postgres@localhost:5432/sahaja_test" ./supabase/tests/run.sh
#
# Database pada PGURL akan diisi ulang dari nol setiap kali dijalankan.
set -euo pipefail

PGURL="${PGURL:-postgres://postgres@localhost:5432/sahaja_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "→ Menyiapkan skema kosong"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -c 'drop schema if exists public cascade;
                                        drop schema if exists auth cascade;
                                        drop schema if exists storage cascade;
                                        create schema public;'

echo "→ Memasang tiruan objek Supabase"
psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$ROOT/supabase/tests/00_stub_supabase.sql"

for file in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ Migrasi $(basename "$file")"
  psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$file"
done

echo "→ Migrasi dijalankan ulang (memastikan idempoten)"
for file in "$ROOT"/supabase/migrations/*.sql; do
  psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$file" > /dev/null
done

# Tanpa pipe: assert yang gagal memunculkan error dan set -e menghentikan skrip.
for file in "$ROOT"/supabase/tests/0[12]_*.sql; do
  echo "→ Test $(basename "$file")"
  psql "$PGURL" -v ON_ERROR_STOP=1 -q -f "$file"
done

echo "✓ Semua test lolos"
