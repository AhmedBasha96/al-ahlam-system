#!/bin/bash
# 🚀 نص التحديث التلقائي لنظام الأحلام

echo "------------------------------------------"
echo "📥 1. سحب التعديلات الجديدة من GitHub..."
git pull

echo "🏗️ 2. إعادة بناء تطبيق الويب..."
docker-compose build app

echo "🔄 3. تشغيل الخدمات..."
docker-compose up -d

echo "🗄️ 4. تحديث أعمدة قاعدة البيانات تلقائياً..."
docker exec app npx prisma migrate deploy

echo "🧹 5. تنظيف الذاكرة المؤقتة..."
docker exec app npx prisma generate

echo "------------------------------------------"
echo "✅ تم التحديث بنجاح! البرنامج الآن يعمل بأحدث نسخة."
echo "------------------------------------------"
