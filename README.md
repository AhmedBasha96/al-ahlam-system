# نظام الأحلام للتوكيلات التجارية
# Al-Ahlam Commercial Agencies Management System

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)

## 📖 نظرة عامة | Overview

نظام إدارة متكامل للتوكيلات التجارية يدعم إدارة المستودعات، المنتجات، المبيعات، والعملاء مع تتبع كامل للمخزون والمعاملات المالية. يستخدم النظام الآن قاعدة بيانات **MySQL** لضمان أفضل أداء واستقرار.

A comprehensive management system for commercial agencies supporting warehouse management, products, sales, and customers with complete inventory and financial transaction tracking. The system now uses **MySQL** for robust data management.

## ✨ الميزات الرئيسية | Key Features

- 🏢 **إدارة متعددة التوكيلات** - Multi-agency management
- 📦 **نظام مخزون ذكي** - Smart inventory system
- 💰 **نظام تسعير مرن** - Flexible pricing system (Factory/Wholesale/Retail)
- 📊 **إدارة مبيعات متقدمة** - Advanced sales management
- 👥 **إدارة المندوبين والعملاء** - Sales reps and customer management
- 📈 **تقارير شاملة** - Comprehensive reports
- 🔐 **نظام صلاحيات متعدد** - Multi-role permission system
- 🌐 **واجهة عربية كاملة** - Full Arabic interface

## 🚀 البدء السريع | Quick Start

### المتطلبات | Prerequisites

- Node.js 20 or higher
- MySQL Server 8.0+
- npm or yarn

### التثبيت | Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd al-ahlam-system

# 2. Install dependencies
npm install

# 3. Configure environment
# Copy .env.example to .env and fill in MySQL credentials
cp .env.example .env

# 5. Apply database migrations & seed
npm run prisma:reset

# 6. Run development server
npm run dev
```

### NPM Scripts

- `npm run dev` - تشغيل مشروع التطوير | Run dev server
- `npm run prisma:migrate` - إنشاء ترحيل جديد | Create new migration
- `npm run prisma:seed` - إضافة البيانات التجريبية | Seed database
- `npm run prisma:reset` - مسح قاعدة البيانات وإعادة بنائها | Reset DB & re-seed (⚠️ Removes current data)
- `npm run prisma:studio` - فتح واجهة قاعدة البيانات | Open Prisma Studio
- `npm run prisma:generate` - تحديث ملفات Prisma Client | Regenerate client

افتح المتصفح على [http://localhost:3000](http://localhost:3000)

Open your browser at [http://localhost:3000](http://localhost:3000)

### الحسابات التجريبية | Demo Accounts

| Username | Role | Password | الدور |
|----------|------|----------|-------|
| `admin` | Admin | `12345` | المدير العام |
| `manager_ali` | Manager | any | مدير توكيلات |
| `ahmed_sales` | Accountant | any | محاسب |
| `kareem_rep` | Sales Rep | any | مندوب مبيعات |

## 📁 هيكل المشروع | Project Structure

```
al-ahlam-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # MySQL migrations
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Login page
│   │   └── dashboard/    # Dashboard pages
│   └── lib/
│       ├── db.ts         # Prisma client
│       └── actions.ts    # Server actions
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## 🗄️ قاعدة البيانات | Database

النظام يستخدم **MySQL** مع Prisma ORM ويحتوي على:

The system uses **MySQL** with Prisma ORM and contains:

- **9 Models**: User, Agency, Warehouse, Product, Stock, Transaction, TransactionItem, Customer, AccountRecord
- **5 User Roles**: Admin, Manager, Accountant, Warehouse Keeper, Sales Representative
- **Multi-agency support** with complete data separation
- **Virtual warehouses** for sales representatives

## 👥 الأدوار | User Roles

| Role | الدور | Permissions | الصلاحيات |
|------|--------|-------------|-----------|
| **ADMIN** | المدير العام | Full system access | صلاحيات كاملة |
| **MANAGER** | مدير توكيلات | Agency-level management | إدارة التوكيلات |
| **ACCOUNTANT** | محاسب | Financial operations | العمليات المالية |
| **WAREHOUSE_KEEPER** | أمين مستودع | Inventory management | إدارة المخزون |
| **SALES_REPRESENTATIVE** | مندوب مبيعات | Sales operations | عمليات البيع |

## 🔄 سير العمل | Workflows

### 1. توريد بضاعة | Stock Supply
```
Warehouse Keeper → Select Warehouse → Add Product → Enter Quantity & Price → Update Stock
```

### 2. تحميل للمندوب | Load to Rep
```
Warehouse → Rep Virtual Warehouse → Deduct from Warehouse → Add to Rep Stock
```

### 3. جرد المندوب | Rep Audit
```
Rep → Enter Remaining Quantities → System Calculates Sales → Create Invoice → Return Stock
```

## 📊 التقارير | Reports

- **تقارير المبيعات** - Sales reports by rep/agency/period
- **تقارير المخزون** - Inventory reports by warehouse
- **التقارير المالية** - Financial reports (income/expenses)
- **حركة المخزون** - Stock movement tracking

## 🛠️ التقنيات المستخدمة | Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js Server Actions
- **Database**: MySQL with Prisma ORM
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS with Emerald theme

## 📚 الوثائق | Documentation

للمزيد من التفاصيل، راجع:

For more details, see:

- **[BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md)** - متطلبات العمل وحالات الاستخدام
- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - الوثائق الفنية والمعمارية
- **[.agent/COMMON_TASKS.md](./.agent/COMMON_TASKS.md)** - دليل المهام الشائعة (بما في ذلك الترحيلات)
- **[.agent/DOC_UPDATE_GUIDE.md](./.agent/DOC_UPDATE_GUIDE.md)** - دليل تحديث الوثائق

## 🔧 البناء للإنتاج | Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📝 ملاحظات مهمة | Important Notes

- ✅ النظام يستخدم **MySQL** (يتطلب خادم MySQL نشط)
- ✅ الواجهة بالعربية بالكامل مع دعم RTL
- ✅ نظام المصادقة الحالي تجريبي (Mock Authentication)
- ⚠️ يُنصح بتطبيق نظام مصادقة حقيقي للإنتاج
- ⚠️ يُنصح بتشفير كلمات المرور باستخدام bcrypt

## 🚧 التطوير المستقبلي | Future Enhancements

- [x] Migrate to MySQL (Prisma)
- [ ] نظام مصادقة حقيقي (NextAuth.js)
- [ ] تشفير كلمات المرور (bcrypt)
- [ ] نظام إشعارات
- [ ] تطبيق موبايل للمندوبين
- [ ] تقارير متقدمة مع رسوم بيانية
- [ ] نظام طباعة الفواتير
- [ ] تكامل مع قارئ الباركود
- [ ] تصدير التقارير (Excel/PDF)

## 📄 الترخيص | License

هذا المشروع خاص بشركة الأحلام للتوكيلات التجارية.

This project is proprietary to Al-Ahlam Commercial Agencies.

## 📞 الدعم | Support

للدعم الفني أو الاستفسارات، يرجى التواصل مع فريق التطوير.

For technical support or inquiries, please contact the development team.

---

**تاريخ آخر تحديث | Last Updated**: يناير 2026 | January 2026  
**الإصدار | Version**: 0.1.0

## 🚢 النشر | Deployment (Docker & Production)

### متطلبات | Prerequisites

- Docker Engine و Docker Compose مثبتان على المضيف
- قاعدة بيانات MySQL جاهزة (يمكن استخدام الخدمة المضمنة في `docker-compose.yml` للاختبار المحلي)
- إعداد متغيرات البيئة الصحيحة في `.env` أو في نظام التهيئة (انظر `.env.production.example`)

### الإعداد السريع | Quick setup

1. انسخ ملف الأمثلة إلى ملف البيئة وأملأ بيانات الاتصال:

```bash
cp .env.production.example .env
# أو: قم بتعيين متغيرات البيئة مباشرةً في منصة النشر
```

2. تأكد من أن `DATABASE_URL` يشير إلى قاعدة MySQL المراد استخدامها (مثال: `mysql://user:password@host:3306/al_ahlam_db`).

### بناء وتشغيل حاوية Docker محليًا | Build & run locally

- بناء صورة Docker:

```bash
docker build -t al-ahlam-system:latest .
```

- تشغيل الحاوية (يستخدم ملف `.env` لتوفير المتغيرات السرية):

```bash
docker run --env-file .env -p 3000:3000 al-ahlam-system:latest
```

> ملاحظة: نقطة الدخول في الصورة تقوم بتشغيل `prisma generate` وستحاول تشغيل `prisma migrate deploy` إذا كان `DATABASE_URL` مُعطى (تقوم بإعادة المحاولة تلقائيًا أثناء انتظار توفر قاعدة البيانات).

### استخدام Docker Compose (موصى به للاختبار المحلي) | Using Docker Compose (recommended for local prod-like)

- ابدأ الخدمات المعينة في `docker-compose.yml` (تتضمن خدمة MySQL و الحاوية للتطبيق):

```bash
docker-compose up --build -d
```

- عرض سجلات الحاوية:

```bash
docker-compose logs -f app
```

- لتنفيذ الترحيلات يُفضَّل تشغيل الخدمة المخصصة `migrate` (تستخدم مرحلة البناء وتضمن توفر Prisma CLI):

```bash
docker-compose run --rm migrate
```

- بديل: تنفيذ الترحيلات داخل حاوية التطبيق (قد لا تتوفر Prisma CLI في صورة التشغيل الأساسية):

```bash
docker-compose exec app npx prisma migrate deploy
# لتشغيل السِيد (إذا كانت الإعدادات متوافرة):
docker-compose exec app npm run prisma:seed
```


### تنفيذ الترحيلات تلقائيًا في بيئة CI/CD | Run migrations in CI/CD

- الخيار الآمن: شغِّل `npx prisma migrate deploy` كخطوة منفصلة في عملية النشر بعد نشر الحاوية أو قبل توجيه المرور إليها.
- ملاحظة: الحاوية لدينا تحاول تنفيذ `prisma migrate deploy` أثناء التشغيل إذا كانت `DATABASE_URL` معرفة، ولكن إدارة الترحيلات في CI تتيح مراقبة وفشل البناء عند وجود مشاكل.

#### مثال بسيط لـ GitHub Actions (فقط كمخطط سريع)

```yaml
# .github/workflows/docker-publish.yml
name: Build and publish Docker image
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/al-ahlam-system:latest
```

### نصائح وأفضل ممارسات | Tips & Best practices

- لا ترتكب ملف `.env` للحسابات والسرية في Git.
- استعمل قاعدة بيانات مُدارة أو بنية احتياطية مناسبة للبيانات في الإنتاج.
- استخدم بروكسي عكسي (مثل Nginx) أو خدمة التوزيع لتشغيل TLS/HTTPS وإدارة التجزئة والتوجيه.
- راقب سجلات الحاوية وصحّتها لمعرفة حالة الترحيلات والاتصال بقاعدة البيانات.
- للفروع الأفقيّة (scale-out)، اجعل التطبيق غير حالاتيّ واستخدم مخزناً للجلسات (Redis) عند الحاجة.
