#!/usr/bin/env bash
set -euo pipefail

# Enterprise Business Graph — Development Environment Initializer
# Usage: bash init.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== EBG Development Environment Setup ==="

# 1. Install dependencies
echo "[1/7] Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "  node_modules exists, skipping install (run 'npm install' manually if needed)"
fi

# 2. Build TypeScript
echo "[2/7] Compiling TypeScript..."
npx tsc
echo "  Build succeeded."

# 3. Start Docker services
echo "[3/7] Starting Docker services (Neo4j, TimescaleDB, Kafka)..."
if command -v docker &>/dev/null; then
  docker compose -f docker/docker-compose.yml up -d
  echo "  Waiting for services to be ready..."
  sleep 10

  # Wait for Neo4j
  echo "  Checking Neo4j..."
  for i in {1..30}; do
    if curl -s http://localhost:7474 >/dev/null 2>&1; then
      echo "  Neo4j is ready."
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "  WARNING: Neo4j not responding after 30 attempts. Continuing anyway."
    fi
    sleep 2
  done

  # Wait for PostgreSQL/TimescaleDB
  echo "  Checking PostgreSQL..."
  for i in {1..20}; do
    if docker compose -f docker/docker-compose.yml exec -T timescaledb pg_isready -q 2>/dev/null; then
      echo "  PostgreSQL is ready."
      break
    fi
    if [ "$i" -eq 20 ]; then
      echo "  WARNING: PostgreSQL not responding after 20 attempts. Continuing anyway."
    fi
    sleep 2
  done
else
  echo "  WARNING: Docker not found. Skipping service startup."
  echo "  Install Docker and run: docker compose -f docker/docker-compose.yml up -d"
fi

# 4. Run Neo4j migrations
echo "[4/7] Running Neo4j schema initialization..."
npx tsx scripts/neo4j-init.ts || echo "  WARNING: Neo4j init failed (is Neo4j running?)"

# 5. Run PostgreSQL migrations
echo "[5/7] Running PostgreSQL migrations..."
npx tsx scripts/pg-migrate.ts || echo "  WARNING: PG migration failed (is PostgreSQL running?)"

# 6. Seed configuration data
echo "[6/7] Seeding configuration data..."
npx tsx scripts/seed.ts || echo "  WARNING: Seed failed (are databases running?)"

# 7. Run regression tests
echo "[7/7] Running build check..."
npx tsc --noEmit
echo "  TypeScript compilation: PASS"

echo ""
echo "=== EBG Environment Ready ==="
echo ""
echo "Available commands:"
echo "  npm run dev          — Start dev server (port 4000)"
echo "  npm run build        — Compile TypeScript"
echo "  npm run test         — Run test suite"
echo "  npm run docker:down  — Stop Docker services"
echo ""
