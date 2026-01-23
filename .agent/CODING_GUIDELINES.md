# Coding Guidelines for Al-Ahlam System
# إرشادات البرمجة لنظام الأحلام

## 🎯 General Principles

1. **Arabic First**: All user-facing text must be in Arabic
2. **Type Safety**: Use TypeScript strictly, avoid `any` when possible
3. **Server-First**: Prefer Server Components over Client Components
4. **Atomic Operations**: Use database transactions for multi-step operations
5. **Revalidation**: Always revalidate paths after data mutations

## 📝 Naming Conventions

### Files
- **Pages**: `page.tsx`
- **Layouts**: `layout.tsx`
- **Components**: `kebab-case.tsx` (e.g., `customer-list.tsx`)
- **Server Actions**: `actions.ts`
- **Database**: `db.ts`

### Code
- **Components**: `PascalCase` (e.g., `CustomerList`)
- **Functions**: `camelCase` (e.g., `getCustomers`)
- **Server Actions**: `camelCase` with domain prefix (e.g., `createProduct`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_ROLE`)
- **Types/Interfaces**: `PascalCase` (e.g., `UserRole`)

## 🏗️ Architecture Patterns

### Server Actions Pattern
```typescript
'use server';

export async function createItem(formData: FormData) {
  // 1. Extract and validate data
  const name = formData.get('name') as string;
  if (!name) throw new Error('Name is required');
  
  // 2. Check permissions
  const user = await getCurrentUser();
  if (user.role !== 'ADMIN') throw new Error('Unauthorized');
  
  // 3. Perform database operation
  await prisma.item.create({ data: { name } });
  
  // 4. Revalidate cache
  revalidatePath('/dashboard/items');
}
```

### Page Component Pattern
```typescript
export default async function ItemsPage() {
  // 1. Fetch data (server-side)
  const items = await getItems();
  
  // 2. Render UI
  return (
    <div>
      <h1>Items</h1>
      <ItemsList items={items} />
    </div>
  );
}
```

### Modal Pattern
```typescript
'use client';

export function ItemModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <form action={serverAction}>
          {/* Form fields */}
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}
```

## 🗄️ Database Patterns

### Using Transactions
```typescript
await prisma.$transaction(async (tx) => {
  // All operations must succeed or all fail
  await tx.stock.update({ where: {...}, data: {...} });
  await tx.transaction.create({ data: {...} });
});
```

### Stock Operations
```typescript
// ALWAYS use transactions for stock changes
await prisma.$transaction(async (tx) => {
  // 1. Check current stock
  const stock = await tx.stock.findUnique({
    where: { warehouseId_productId: { warehouseId, productId } }
  });
  
  // 2. Validate quantity
  if (stock.quantity < requestedQty) {
    throw new Error('Insufficient stock');
  }
  
  // 3. Update stock
  await tx.stock.update({
    where: { warehouseId_productId: { warehouseId, productId } },
    data: { quantity: { decrement: requestedQty } }
  });
  
  // 4. Log transaction
  await tx.transaction.create({
    data: {
      type: 'SALE',
      totalAmount: amount,
      userId: user.id,
      agencyId: user.agencyId,
      items: { create: [...] }
    }
  });
});
```

### Unique Constraints
```typescript
// Stock has unique constraint on [warehouseId, productId]
// Use upsert to handle create or update
await prisma.stock.upsert({
  where: { warehouseId_productId: { warehouseId, productId } },
  update: { quantity: newQuantity },
  create: { warehouseId, productId, quantity: newQuantity }
});
```

## 🎨 UI/Styling Guidelines

### Tailwind Classes
```typescript
// Primary button
className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"

// Secondary button
className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"

// Danger button
className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"

// Card
className="bg-white rounded-lg shadow-md p-6"

// Table header
className="bg-emerald-600 text-white"

// Table row
className="hover:bg-gray-50 transition"
```

### Arabic Text & RTL
```typescript
// Always use dir="rtl" for Arabic content
<div dir="rtl" className="text-right">
  <p>النص العربي</p>
</div>

// For mixed content, use appropriate direction
<div dir="auto">
  {arabicText}
</div>
```

### Responsive Design
```typescript
// Mobile-first approach
className="w-full md:w-1/2 lg:w-1/3"

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="block md:hidden"
```

## 🔐 Security Patterns

### Permission Checks
```typescript
export async function deleteItem(id: string) {
  'use server';
  
  // ALWAYS check permissions first
  const user = await getCurrentUser();
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    throw new Error('Unauthorized');
  }
  
  // Then perform operation
  await prisma.item.delete({ where: { id } });
  revalidatePath('/dashboard/items');
}
```

### Data Scoping
```typescript
// Scope data by agency for non-admin users
export async function getItems() {
  const user = await getCurrentUser();
  
  if (user.role === 'ADMIN') {
    return await prisma.item.findMany();
  }
  
  // Non-admin: only see their agency's items
  return await prisma.item.findMany({
    where: { agencyId: user.agencyId }
  });
}
```

## 📊 Data Handling

### FormData Extraction
```typescript
export async function createItem(formData: FormData) {
  'use server';
  
  // Extract values
  const name = formData.get('name') as string;
  const price = Number(formData.get('price'));
  const agencyId = formData.get('agencyId') as string;
  
  // Validate
  if (!name || !agencyId) {
    throw new Error('Required fields missing');
  }
  
  // Create
  await prisma.item.create({
    data: { name, price, agencyId }
  });
}
```

### Image Handling (Base64)
```typescript
async function fileToBase64(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${file.type};base64,${base64}`;
}
```

### Decimal Handling
```typescript
// Prisma returns Decimal objects
import { Decimal } from '@prisma/client/runtime/library';

// Convert to number for UI
const price = Number(product.retailPrice);

// Create Decimal for database
const newPrice = new Decimal(100.50);
```

## 🔄 Common Operations

### Creating a User with Virtual Warehouse
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create user
  const user = await tx.user.create({
    data: { username, password, role, name, agencyId, pricingType }
  });
  
  // 2. If sales rep, create virtual warehouse
  if (role === 'SALES_REPRESENTATIVE') {
    await tx.warehouse.create({
      data: {
        id: user.id,  // Same ID as user
        name: `عهدة المندوب: ${name}`,
        agencyId: user.agencyId!
      }
    });
  }
});
```

### Loading Stock to Representative
```typescript
await prisma.$transaction(async (tx) => {
  for (const item of items) {
    // 1. Deduct from warehouse
    await tx.stock.update({
      where: { warehouseId_productId: { warehouseId, productId: item.productId } },
      data: { quantity: { decrement: item.quantity } }
    });
    
    // 2. Add to rep's virtual warehouse
    await tx.stock.upsert({
      where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
      update: { quantity: { increment: item.quantity } },
      create: { warehouseId: repId, productId: item.productId, quantity: item.quantity }
    });
    
    // 3. Log transaction
    await tx.transaction.create({
      data: {
        type: 'SALE',
        totalAmount: 0,
        userId: repId,
        agencyId: rep.agencyId!,
        warehouseId: warehouseId,
        note: `تحميل للمندوب: ${rep.name}`
      }
    });
  }
});
```

## 🐛 Error Handling

### Server Action Errors
```typescript
export async function createItem(formData: FormData) {
  'use server';
  
  try {
    // Perform operation
    await prisma.item.create({ data: {...} });
    revalidatePath('/dashboard/items');
  } catch (error) {
    console.error('[createItem] Error:', error);
    throw new Error('Failed to create item');
  }
}
```

### Client-Side Error Display
```typescript
'use client';

export function ItemForm() {
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(formData: FormData) {
    try {
      await createItem(formData);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }
  
  return (
    <form action={handleSubmit}>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4">
          {error}
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

## ✅ Testing Checklist

Before committing code:
- [ ] All user-facing text is in Arabic
- [ ] Server actions have permission checks
- [ ] Stock operations use transactions
- [ ] Paths are revalidated after mutations
- [ ] TypeScript has no errors
- [ ] Forms have proper validation
- [ ] Error messages are user-friendly
- [ ] Responsive design works on mobile

## 📚 Reference

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- Tailwind Docs: https://tailwindcss.com/docs

---

**Last Updated**: January 2026
