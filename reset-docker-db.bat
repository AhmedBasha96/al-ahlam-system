@echo off
setlocal enabledelayedexpansion

:: Colors/Prefixes
set GREEN=[INFO]
set YELLOW=[WARN]
set RED=[ERROR]

:: Ensure we are in the script's directory
cd /d "%~dp0"

echo ===========================================
echo         Docker Database Reset Script
echo ===========================================
echo Choose the database reset method:
echo 1) Full Hard Reset - Stop containers, delete volume, recreate and run migrations ^& seed
echo 2) Prisma Migrate Reset - Recreate tables and run migrations ^& seed without deleting volumes
echo 3) Soft Reset - Clear transactional data only (runs scripts/reset-db.ts)
echo 4) Cancel
echo ===========================================
set /p OPTION="Enter your choice (1-4): "

if "%OPTION%"=="1" (
    echo %GREEN% Starting Full Hard Reset...
    echo %YELLOW% This will permanently delete all data and recreate the database.
    
    echo %GREEN% Stopping containers and removing volumes...
    docker compose down -v
    
    echo %GREEN% Starting database container...
    docker compose up -d db
    
    echo %GREEN% Waiting for database to be ready (10 seconds)...
    timeout /t 10 /nobreak > nul
    
    echo %GREEN% Applying migrations...
    docker compose run --rm migrate
    
    echo %GREEN% Starting app and nginx...
    docker compose up -d app nginx
    
    echo %GREEN% Seeding database...
    docker compose exec -T app npm run prisma:seed || docker compose run --rm migrate npx prisma db seed
    
    echo %GREEN% Database has been completely recreated and reset successfully!
    goto end
)

if "%OPTION%"=="2" (
    echo %GREEN% Resetting database via Prisma Migrate...
    docker compose run --rm migrate npx prisma migrate reset --force
    echo %GREEN% Database tables recreated and seeded successfully!
    goto end
)

if "%OPTION%"=="3" (
    echo %GREEN% Clearing data while keeping database schema intact...
    docker compose run --rm migrate npx tsx scripts/reset-db.ts
    echo %GREEN% Transactional records cleared successfully!
    goto end
)

if "%OPTION%"=="4" (
    echo Operation cancelled.
    goto end
)

echo Invalid choice.
:end
pause
