@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: Colors (if supported, otherwise plain text)
set GREEN=[INFO]
set YELLOW=[WARN]
set RED=[ERROR]

:: Ensure we are in the script's directory
cd /d "%~dp0"

echo ===========================================
echo    اسكريبت تفريغ قاعدة البيانات في Docker   
echo ===========================================
echo اختر طريقة التفريغ المناسبة:
echo 1) تفريغ كامل (Hard Reset) - حذف الحاوية والـ Volume وإعادة البناء والتشغيل والتهجير والـ Seed
echo 2) تصفير البيانات عبر Prisma (Migrate Reset) - حذف الجداول وإعادة تطبيق الـ Migrations والـ Seed
echo 3) تفريغ سجلات المعاملات فقط (Soft Reset) - تشغيل اسكريبت reset-db.ts
echo 4) إلغاء العملية
echo ===========================================
set /p OPTION="أدخل رقم الاختيار (1-4): "

if "%OPTION%"=="1" (
    echo %GREEN% بدء التفريغ الكامل للحاوية والـ Volume...
    echo %YELLOW% سيتم حذف كل البيانات نهائياً وتصفير قاعدة البيانات.
    
    echo %GREEN% إيقاف الحاويات وحذف الـ Volume...
    docker compose down -v
    
    echo %GREEN% تشغيل قاعدة البيانات...
    docker compose up -d db
    
    echo %GREEN% انتظار قاعدة البيانات حتى تصبح جاهزة (10 ثوانٍ)...
    timeout /t 10 /nobreak > nul
    
    echo %GREEN% تطبيق الـ Migrations...
    docker compose run --rm migrate
    
    echo %GREEN% تشغيل باقي الخدمات...
    docker compose up -d app nginx
    
    echo %GREEN% تطبيق الـ Seed لتغذية البيانات الأساسية...
    docker compose exec -T app npm run prisma:seed || docker compose run --rm migrate npx prisma db seed
    
    echo %GREEN% تم تفريغ وإعادة بناء قاعدة البيانات بالكامل بنجاح!
    goto end
)

if "%OPTION%"=="2" (
    echo %GREEN% تصفير قاعدة البيانات عبر Prisma...
    docker compose run --rm migrate npx prisma migrate reset --force
    echo %GREEN% تم تصفير الجداول وإعادة تطبيق المايجريشن والـ Seed بنجاح!
    goto end
)

if "%OPTION%"=="3" (
    echo %GREEN% تفريغ السجلات مع الحفاظ على هيكل الجداول الأساسية...
    docker compose run --rm migrate npx tsx scripts/reset-db.ts
    echo %GREEN% تم تصفير سجلات المعاملات بنجاح!
    goto end
)

if "%OPTION%"=="4" (
    echo تم إلغاء العملية.
    goto end
)

echo اختيار غير صحيح.
:end
pause
