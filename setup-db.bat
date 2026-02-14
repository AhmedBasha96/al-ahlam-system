@echo off
setlocal

:: Configuration
:: Usage: setup-db.bat [env]
:: where env is "prod" (default) or "test"

:: Colors for Windows Terminal
set GREEN=[INFO] 
set RED=[ERROR] 

set ENV=%1
if "%ENV%"=="" set ENV=prod
set ENV_FILE=.env

:: Always use .env file but with environment-specific variable prefix
if not exist %ENV_FILE% (
    echo %RED% Environment file %ENV_FILE% not found!
    exit /b 1
)

echo %GREEN% Using environment file: %ENV_FILE%
echo %GREEN% Implementing setup for environment: %ENV%

:: Set environment-specific DATABASE_URL based on ENV parameter
if "%ENV%"=="test" (
    echo %GREEN% Using TEST database configuration
    set DB_ENV_VAR=DATABASE_URL_TEST
) else (
    echo %GREEN% Using PROD database configuration
    set DB_ENV_VAR=DATABASE_URL
)

:: 1. Run Migrations
echo %GREEN% Running database migrations...
call npx dotenv-cli -e %ENV_FILE% -- npx cross-env DATABASE_URL=${%DB_ENV_VAR%} npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Migration failed.
    exit /b 1
)
echo %GREEN% Migrations applied successfully.

:: 2. Run Seeds
echo %GREEN% Seeding database...
call npx dotenv-cli -e %ENV_FILE% -- npx cross-env DATABASE_URL=${%DB_ENV_VAR%} npm run prisma:seed
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Seeding failed.
    exit /b 1
)
echo %GREEN% Database seeded successfully.

echo %GREEN% Database setup complete!
endlocal