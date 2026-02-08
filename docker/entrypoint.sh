#!/bin/sh
set -e

# Disable telemetry
export NEXT_TELEMETRY_DISABLED=1

# If DATABASE_URL present, generate Prisma client and try to apply migrations
if [ -n "$DATABASE_URL" ]; then
  # Prefer using local prisma CLI if present in node_modules
  if [ -x "./node_modules/.bin/prisma" ] || [ -d "./node_modules/prisma" ]; then
    echo "[entrypoint] prisma CLI found — generating client and applying migrations (if any)."

    # Generate Prisma client (safe to run multiple times)
    ./node_modules/.bin/prisma generate || true

    # Try to run migrations with retries while waiting for DB readiness
    i=0
    max_retries=30
    until ./node_modules/.bin/prisma migrate deploy; do
      i=$((i+1))
      if [ "$i" -ge "$max_retries" ]; then
        echo "[entrypoint] Reached $max_retries retries, continuing without successful migrate."
        break
      fi
      echo "[entrypoint] Waiting for database to be ready (attempt $i/$max_retries)..."
      sleep 2
    done
  else
    echo "[entrypoint] prisma CLI not found in node_modules — skipping automatic migrations."
    echo "[entrypoint] To run migrations, use the 'migrate' job/service or run: npx prisma migrate deploy"
  fi
fi

# Exec the provided command (e.g. npm start)
exec "$@"
