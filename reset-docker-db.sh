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
echo "   اسكريبت تفريغ قاعدة البيانات في Docker   "
echo "==========================================="
echo "اختر طريقة التفريغ المناسبة:"
echo "1) تفريغ كامل (Hard Reset) - حذف الحاوية والـ Volume وإعادة البناء والتشغيل والتهجير"
echo "2) تصفير البيانات عبر Prisma (Migrate Reset) - حذف الجداول وإعادة تطبيق الـ Migrations والـ Seed"
echo "3) تفريغ سجلات المعاملات فقط (Soft Reset) - تشغيل اسكريبت reset-db.ts داخل الحاوية"
echo "4) إلغاء العملية"
echo "==========================================="
read -p "أدخل رقم الاختيار (1-4): " OPTION

case $OPTION in
    1)
        log_info "بدء التفريغ الكامل للحاوية والـ Volume..."
        log_warn "سيتم حذف كل البيانات نهائياً وتصفير قاعدة البيانات."
        
        # 1. إيقاف الحاويات وحذف الـ volume الخاص بقاعدة البيانات
        log_info "إيقاف الحاويات وحذف الـ Volume..."
        docker compose down -v
        
        # 2. تشغيل خدمة قاعدة البيانات فقط أولاً
        log_info "تشغيل قاعدة البيانات..."
        docker compose up -d db
        
        # 3. الانتظار حتى تكون قاعدة البيانات جاهزة لاستقبال الاتصالات
        log_info "انتظار قاعدة البيانات حتى تصبح جاهزة..."
        docker compose exec db sh -c 'until mysqladmin ping -h localhost --silent; do sleep 1; done' 2>/dev/null || sleep 10
        
        # 4. تشغيل المايجريشن والتهجير
        log_info "تطبيق الـ Migrations..."
        docker compose run --rm migrate
        
        # 5. تشغيل باقي الخدمات
        log_info "تشغيل باقي الخدمات..."
        docker compose up -d app nginx
        
        # 6. تشغيل الـ Seed
        log_info "تطبيق الـ Seed..."
        docker compose exec -T app npm run prisma:seed || docker compose run --rm migrate npx prisma db seed
        
        log_info "✅ تم تفريغ وإعادة بناء قاعدة البيانات بالكامل بنجاح!"
        ;;
        
    2)
        log_info "تصفير قاعدة البيانات عبر Prisma..."
        # تشغيل migrate reset في حاوية migrate
        docker compose run --rm migrate npx prisma migrate reset --force
        log_info "✅ تم تصفير الجداول وإعادة تطبيق المايجريشن والـ Seed بنجاح!"
        ;;
        
    3)
        log_info "تفريغ السجلات مع الحفاظ على هيكل الجداول الأساسية..."
        # تشغيل reset-db.ts في حاوية migrate
        docker compose run --rm migrate npx tsx scripts/reset-db.ts
        log_info "✅ تم تصفير سجلات المعاملات بنجاح!"
        ;;
        
    *)
        log_info "تم إلغاء العملية."
        exit 0
        ;;
esac
