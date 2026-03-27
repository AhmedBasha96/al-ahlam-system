#!/bin/bash
# 🚀 نص التحديث التلقائي لنظام الأحلام (نسخة مطورة)

echo "------------------------------------------"
echo "📥 1. سحب التعديلات الجديدة من GitHub..."
# إجبار السحب وتجاهل أي تغييرات بسيطة محلياً لضمان المزامنة
git pull

echo "🏗️ 2. إعادة بناء تطبيق الويب..."
docker compose build app

echo "🔄 3. تشغيل الخدمات..."
docker compose up -d

echo "🗄️ 4. مزامنة قاعدة البيانات..."
docker compose exec app npx prisma db push --accept-data-loss

echo "🧹 5. تنظيف الذاكرة المؤقتة..."
docker compose exec app npx prisma generate

echo "------------------------------------------"
echo "✅ تم التحديث بنجاح! البرنامج الآن يعمل بأحدث نسخة."
echo "------------------------------------------"
