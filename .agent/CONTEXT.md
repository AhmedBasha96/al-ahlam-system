# Al-Ahlam System - AI Agent Context
# نظام الأحلام - سياق للوكلاء الذكاء الاصطناعي

## 🎯 System Purpose

This is a **Commercial Agencies Management System** (نظام إدارة التوكيلات التجارية) for managing:
- Multiple commercial agencies (توكيلات تجارية)
- Warehouses and inventory (مستودعات ومخزون)
- Products with 3-tier pricing (منتجات بثلاث مستويات أسعار)
- Sales representatives with virtual warehouses (مندوبي مبيعات)
- Customers and sales transactions (عملاء ومعاملات)
- Financial accounting (محاسبة مالية)

## 🏗️ Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3 with React Compiler
- **Database**: SQLite with Prisma ORM 6.19.0
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.0
- **API**: Next.js Server Actions

## 📁 Key Directories

```
src/
├── app/
│   ├── page.tsx              # Login page
│   └── dashboard/            # All dashboard pages
│       ├── agencies/         # Agency management
│       ├── products/         # Product catalog
│       ├── warehouses/       # Warehouse & inventory
│       ├── users/            # User management
│       ├── customers/        # Customer management
│       ├── reps/             # Sales rep management
│       └── reports/sales/    # Sales reports
└── lib/
    ├── db.ts                 # Prisma client
    └── actions.ts            # Server actions (API)

prisma/
└── schema.prisma             # Database schema
```

## 🗄️ Database Models (9 total)

1. **User** - System users with 5 roles
2. **Agency** - Commercial agencies
3. **Warehouse** - Physical + virtual warehouses
4. **Product** - Products with factoryPrice, wholesalePrice, retailPrice
5. **Stock** - Inventory (warehouseId + productId + quantity)
6. **Transaction** - Sales/purchases with items
7. **TransactionItem** - Individual items in transactions
8. **Customer** - Customer database
9. **AccountRecord** - Income/expense records

## 👥 User Roles

- **ADMIN** - Full system access
- **MANAGER** - Agency-level management
- **ACCOUNTANT** - Financial operations
- **WAREHOUSE_KEEPER** - Inventory management
- **SALES_REPRESENTATIVE** - Sales operations

## 🔑 Key Concepts

### Virtual Warehouses
Each Sales Representative has a virtual warehouse (id = user.id) to track their stock custody.

### 3-Tier Pricing
- `factoryPrice` - Cost price (سعر المصنع)
- `wholesalePrice` - Wholesale price (سعر الجملة)
- `retailPrice` - Retail price (سعر القطاعي)

### Stock Movement Flow
```
Warehouse → Load to Rep → Rep Sells → Audit → Return to Warehouse
```

### Transaction Types
- `SALE` - Outgoing stock (warehouse deduction)
- `PURCHASE` - Incoming stock (warehouse addition)
- `RETURN_IN` - Customer return
- `RETURN_OUT` - Return to supplier

## 🔐 Authentication

**Current**: Mock authentication using global state
**Location**: `src/lib/actions.ts` → `getCurrentUser()`, `setMockUser()`
**Note**: Needs proper implementation (NextAuth.js recommended)

## 🌐 Language & UI

- **Primary Language**: Arabic (RTL)
- **UI Direction**: Right-to-left
- **Color Theme**: Emerald (green)
- **All user-facing text**: Arabic

## 📝 Important Conventions

### Server Actions
All API functions are in `src/lib/actions.ts` with `'use server'` directive.

### Forms
Use Next.js Server Actions pattern:
```tsx
<form action={serverAction}>
  <input name="field" />
  <button type="submit">Submit</button>
</form>
```

### Data Fetching
Server Components fetch data directly:
```tsx
const items = await getItems();
```

### Revalidation
Always call `revalidatePath()` after mutations:
```tsx
revalidatePath('/dashboard', 'layout');
```

## 🚨 Common Pitfalls

1. **Stock Consistency**: Always use transactions for stock operations
2. **Virtual Warehouses**: Rep ID = Warehouse ID for sales reps
3. **Pricing**: Check user's `pricingType` (WHOLESALE/RETAIL) for reps
4. **Arabic Text**: All UI text must be in Arabic
5. **Revalidation**: Don't forget to revalidate paths after mutations

## 📚 Documentation Files

- `README.md` - Quick start guide
- `BUSINESS_REQUIREMENTS.md` - Business logic and workflows
- `TECHNICAL_DOCUMENTATION.md` - Architecture and API docs

## 🔍 Finding Code

### To find server actions:
Look in `src/lib/actions.ts` - all grouped by domain

### To find UI components:
Look in `src/app/dashboard/[feature]/` - co-located with pages

### To understand data model:
Look in `prisma/schema.prisma` - complete schema with relationships

## 💡 Quick Reference

### Get current user:
```typescript
const user = await getCurrentUser();
// Returns: { id, role, agencyId? }
```

### Create transaction:
```typescript
await prisma.transaction.create({
  data: {
    type: 'SALE',
    totalAmount: 100,
    userId: user.id,
    agencyId: user.agencyId,
    items: { create: [...] }
  }
});
```

### Update stock:
```typescript
await updateStock(warehouseId, productId, quantity, note, factoryPrice);
```

## 🎨 UI Patterns

### Modal:
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-white rounded-lg p-6">
      {/* Content */}
    </div>
  </div>
)}
```

### Table:
```tsx
<table className="w-full">
  <thead className="bg-emerald-600 text-white">
    <tr><th>Column</th></tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {items.map(item => <tr key={item.id}>...</tr>)}
  </tbody>
</table>
```

## 🔧 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npx prisma generate  # Regenerate Prisma client
npx prisma db push   # Apply schema changes
npx prisma studio    # Open database GUI
```

## ⚠️ Known Issues

- Authentication is mock-based (needs proper implementation)
- Passwords are plain text (needs bcrypt hashing)
- No rate limiting
- No email/SMS notifications

## 📞 Demo Accounts

- `admin` / `12345` - Admin
- `manager_ali` / any - Manager
- `ahmed_sales` / any - Accountant
- `kareem_rep` / any - Sales Rep

---

**Last Updated**: January 2026  
**Version**: 0.1.0
