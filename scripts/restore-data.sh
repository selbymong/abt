#!/usr/bin/env bash
set -euo pipefail

# Restore Neo4j + PostgreSQL data from archived exports.
# Brings a fresh docker compose environment to the same state as the archived databases.
#
# Usage: bash scripts/restore-data.sh
#
# Prerequisites:
#   docker compose -f docker/docker-compose.yml up -d
#   Wait for services to be healthy.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

NEO4J_CONTAINER="ebg-neo4j"
PG_CONTAINER="ebg-postgres"
NEO4J_USER="neo4j"
NEO4J_PASS="ebg_dev_password"
PG_USER="ebg"
PG_DB="ebg"

NEO4J_EXPORT="$PROJECT_DIR/data/neo4j-export.cypher"
PG_EXPORT="$PROJECT_DIR/data/postgres-export.sql"

echo "=== EBG Data Restore ==="

# --- Preflight checks ---

if [ ! -f "$NEO4J_EXPORT" ]; then
  echo "ERROR: $NEO4J_EXPORT not found." >&2
  exit 1
fi
if [ ! -f "$PG_EXPORT" ]; then
  echo "ERROR: $PG_EXPORT not found." >&2
  exit 1
fi

if ! docker inspect "$NEO4J_CONTAINER" --format '{{.State.Running}}' 2>/dev/null | grep -q true; then
  echo "ERROR: $NEO4J_CONTAINER is not running. Start it first:" >&2
  echo "  docker compose -f docker/docker-compose.yml up -d" >&2
  exit 1
fi

if ! docker inspect "$PG_CONTAINER" --format '{{.State.Running}}' 2>/dev/null | grep -q true; then
  echo "ERROR: $PG_CONTAINER is not running. Start it first:" >&2
  echo "  docker compose -f docker/docker-compose.yml up -d" >&2
  exit 1
fi

# --- Step 1: Restore Neo4j ---

echo ""
echo "[1/3] Clearing Neo4j..."
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "CALL apoc.periodic.iterate('MATCH (n) RETURN n', 'DETACH DELETE n', {batchSize: 1000})" \
  >/dev/null 2>&1 || \
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "MATCH (n) DETACH DELETE n"

# Drop all constraints and indexes so the export can recreate them
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "CALL apoc.schema.assert({}, {})" >/dev/null 2>&1 || true

# Drop any remaining indexes (apoc.schema.assert may not catch range indexes)
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" --format plain \
  "SHOW INDEXES YIELD name WHERE name <> 'index_343aff4e' RETURN 'DROP INDEX ' + name + ' IF EXISTS;' AS cmd" 2>/dev/null | \
  grep -v '^cmd$' | grep -v '^$' | while read -r cmd; do
    docker exec "$NEO4J_CONTAINER" cypher-shell \
      -u "$NEO4J_USER" -p "$NEO4J_PASS" "$cmd" 2>/dev/null || true
  done

docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" --format plain \
  "SHOW CONSTRAINTS YIELD name RETURN 'DROP CONSTRAINT ' + name + ' IF EXISTS;' AS cmd" 2>/dev/null | \
  grep -v '^cmd$' | grep -v '^$' | while read -r cmd; do
    docker exec "$NEO4J_CONTAINER" cypher-shell \
      -u "$NEO4J_USER" -p "$NEO4J_PASS" "$cmd" 2>/dev/null || true
  done

echo "[2/3] Loading Neo4j data ($(wc -l < "$NEO4J_EXPORT") lines)..."
docker exec -i "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  < "$NEO4J_EXPORT"

NEO4J_COUNT=$(docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" --format plain \
  "MATCH (n) RETURN count(n) AS cnt" | tail -1)
echo "  Neo4j: $NEO4J_COUNT nodes loaded."

# --- Step 2: Restore PostgreSQL ---

echo "[3/3] Loading PostgreSQL data..."
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" \
  --quiet --set ON_ERROR_STOP=off \
  < "$PG_EXPORT" 2>&1 | grep -v "^DROP\|^SET\|^CREATE\|^ALTER\|^COPY\|^INSERT\|^--\|^$\|^COMMENT\|^GRANT\|^REVOKE\|timescaledb\|^WARNING\|^NOTICE\|^pg_restore" | head -20 || true

PG_TABLES=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
echo "  PostgreSQL: $PG_TABLES tables."

# --- Step 3: Apply Neo4j permissions ---

echo ""
echo "Applying Neo4j ebg_app user permissions..."
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "CREATE USER ebg_app IF NOT EXISTS SET PASSWORD 'ebg_app_password' SET PASSWORD CHANGE NOT REQUIRED" 2>/dev/null || true
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "GRANT ROLE editor TO ebg_app" 2>/dev/null || true
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "DENY DELETE ON GRAPH neo4j NODE JournalEntry TO ebg_app" 2>/dev/null || true
docker exec "$NEO4J_CONTAINER" cypher-shell \
  -u "$NEO4J_USER" -p "$NEO4J_PASS" \
  "DENY DELETE ON GRAPH neo4j NODE LedgerLine TO ebg_app" 2>/dev/null || true

echo ""
echo "=== Data Restore Complete ==="
echo ""
echo "Neo4j:      bolt://localhost:7687  (neo4j / ebg_dev_password)"
echo "PostgreSQL: localhost:5433/ebg     (ebg / ebg_dev_password)"
