#!/bin/bash

# Configuration
# Usage: ./setup-db.sh [env]
# where env is "prod" (default) or "test"

set -euo pipefail

ENV=${1:-prod}
ENV_FILE=".env"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO] $1${NC}"; }
log_error() { echo -e "${RED}[ERROR] $1${NC}"; }

if [ "$ENV" = "test" ]; then
    ENV_FILE=".env.test"
elif [ "$ENV" != "prod" ]; then
    log_error "Unknown environment: $ENV. Usage: ./setup-db.sh [prod|test]"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file $ENV_FILE not found!"
    exit 1
fi

log_info "Using environment file: $ENV_FILE"

# Export variables from the environment file
export $(grep -v '^#' "$ENV_FILE" | xargs)

log_info "🔌 Implementing setup for environment: $ENV"
log_info "Target Database: $DATABASE_URL"

# 1. Run Migrations
log_info "🔄 Running database migrations..."
if npx prisma migrate deploy; then
    log_info "✅ Migrations applied successfully."
else
    log_error "❌ Migration failed."
    exit 1
fi

# 2. Run Seeds
log_info "🌱 Seeding database..."
if npm run prisma:seed; then
    log_info "✅ Database seeded successfully."
else
    log_error "❌ Seeding failed."
    exit 1
fi

log_info "🎉 Database setup complete!"
