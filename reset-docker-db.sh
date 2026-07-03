#!/bin/bash
# Exit on error
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

# Ensure we are in the correct directory
cd "$(dirname "$0")"

echo "==========================================="
echo "        Docker Database Reset Script        "
echo "==========================================="
echo "Choose the database reset method:"
echo "1) Full Hard Reset - Stop containers, delete volume, recreate and run migrations & seed"
echo "2) Prisma Migrate Reset - Recreate tables and run migrations & seed without deleting volumes"
echo "3) Soft Reset - Clear transactional data only (runs scripts/reset-db.ts)"
echo "4) Cancel"
echo "==========================================="
read -p "Enter your choice (1-4): " OPTION

case $OPTION in
    1)
        log_info "Starting Full Hard Reset..."
        log_warn "This will permanently delete all data and recreate the database."
        
        # 1. Stop containers and delete database volume
        log_info "Stopping containers and removing volumes..."
        docker compose down -v
        
        # 2. Start database service only
        log_info "Starting database container..."
        docker compose up -d db
        
        # 3. Wait for database to be fully healthy
        log_info "Waiting for database to be fully healthy..."
        attempts=0
        max_attempts=30
        while [ $attempts -lt $max_attempts ]; do
            status=$(docker inspect -f '{{.State.Health.Status}}' db 2>/dev/null || echo "unknown")
            if [ "$status" = "healthy" ]; then
                log_info "Database is healthy!"
                break
            fi
            log_info "Database status: $status... waiting (attempt $((attempts+1))/$max_attempts)..."
            sleep 2
            attempts=$((attempts+1))
        done
        
        if [ "$status" != "healthy" ]; then
            log_error "Database failed to become healthy in time. Trying to proceed anyway..."
        fi
        
        # Extra short sleep to ensure connections are accepted
        sleep 3
        
        # 4. Run database migrations
        log_info "Applying migrations..."
        docker compose run --rm migrate
        
        # 5. Start remaining services
        log_info "Starting app and nginx..."
        docker compose up -d app nginx
        
        # 6. Seed the database
        log_info "Seeding the database..."
        docker compose exec -T app npm run prisma:seed || docker compose run --rm migrate npx prisma db seed
        
        log_info "✅ Database has been completely recreated and reset successfully!"
        ;;
        
    2)
        log_info "Resetting database via Prisma Migrate..."
        # Run migrate reset in the migrate container
        docker compose run --rm migrate npx prisma migrate reset --force
        log_info "✅ Database tables recreated and seeded successfully!"
        ;;
        
    3)
        log_info "Clearing data while keeping database schema intact..."
        # Run reset-db.ts script in the migrate container
        docker compose run --rm migrate npx tsx scripts/reset-db.ts
        log_info "✅ Transactional records cleared successfully!"
        ;;
        
    *)
        log_info "Operation cancelled."
        exit 0
        ;;
esac
