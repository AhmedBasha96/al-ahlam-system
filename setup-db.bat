@echo off
setlocal

:: Colors
set GREEN=[INFO] 
set RED=[ERROR] 

:: Configuration
:: Uses .env file automatically

echo %GREEN% Using environment configuration from .env

:: 0. Generate Client
echo %GREEN% Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Generate failed.
    exit /b 1
)

:: 1. Run Migrations
echo %GREEN% Running database migrations (deploy)...
call npx prisma migrate deploy
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Migration failed.
    exit /b 1
)
echo %GREEN% Migrations applied successfully.

:: 2. Run Seeds
echo %GREEN% Seeding database...
call npm run prisma:seed
if %ERRORLEVEL% NEQ 0 (
    echo %RED% Seeding failed.
    exit /b 1
)
echo %GREEN% Database seeded successfully.

echo %GREEN% Database setup complete!
endlocal