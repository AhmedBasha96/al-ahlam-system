# Common Tasks Guide for AI Agents
# دليل المهام الشائعة للوكلاء الذكاء الاصطناعي

## 🎯 Quick Task Reference

This guide provides step-by-step instructions for common development tasks in the Al-Ahlam system.

---

## 📦 Adding a New Product

### Steps:
1. Navigate to Products page (`/dashboard/products`)
2. Click "إضافة منتج جديد" button
3. Fill in the form in `src/app/dashboard/products/page.tsx`
4. Server action: `createProduct()` in `src/lib/actions.ts`

### Code Example:
```typescript
// In actions.ts
export async function createProduct(formData: FormData) {
  'use server';
  
  const name = formData.get('name') as string;
  const factoryPrice = Number(formData.get('factoryPrice'));
  const wholesalePrice = Number(formData.get('wholesalePrice'));
  const retailPrice = Number(formData.get('retailPrice'));
  const agencyId = formData.get('agencyId') as string;
  const imageFile = formData.get('image') as File | null;
  
  if (!name || !agencyId) throw new Error('Name and Agency required');
  
  const imageBase64 = await fileToBase64(imageFile);
  
  await prisma.product.create({
    data: {
      name,
      factoryPrice,
      wholesalePrice,
      retailPrice,
      agencyId,
      image: imageBase64
    }
  });
  
  revalidatePath('/dashboard/products');
}
```

---

## 🏢 Adding a New Agency

### Steps:
1. Navigate to Agencies page (`/dashboard/agencies`)
2. Click "إضافة توكيل جديد"
3. Server action: `createAgency()` in `src/lib/actions.ts`

### Code Example:
```typescript
export async function createAgency(formData: FormData) {
  'use server';
  
  const name = formData.get('name') as string;
  const imageFile = formData.get('image') as File | null;
  
  if (!name) throw new Error('Name is required');
  
  const user = await getCurrentUser();
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    throw new Error('Unauthorized');
  }
  
  const imageBase64 = await fileToBase64(imageFile);
  
  await prisma.agency.create({
    data: { name, image: imageBase64 }
  });
  
  revalidatePath('/dashboard/agencies');
}
```

---

## 📥 Supplying Stock to Warehouse

### Steps:
1. Navigate to Warehouse details (`/dashboard/warehouses/[id]`)
2. Go to "Inventory Audit" tab
3. Enter quantity for products
4. Optionally update prices
5. Server action: `updateStock()` or `supplyStock()`

### Code Example:
```typescript
export async function supplyStock(
  warehouseId: string,
  productId: string,
  addedQuantity: number,
  factoryPrice?: number,
  updateBasePrice?: boolean,
  wholesalePrice?: number,
  retailPrice?: number
) {
  'use server';
  
  if (addedQuantity <= 0) throw new Error('Quantity must be > 0');
  
  const currentStock = await prisma.stock.findUnique({
    where: { warehouseId_productId: { warehouseId, productId } }
  });
  
  const newQuantity = (currentStock?.quantity || 0) + addedQuantity;
  
  await updateStock(
    warehouseId,
    productId,
    newQuantity,
    `توريد كمية جديدة: +${addedQuantity}`,
    factoryPrice,
    updateBasePrice,
    wholesalePrice,
    retailPrice
  );
}
```

---

## 🚚 Loading Stock to Sales Representative

### Steps:
1. Navigate to Warehouse details (`/dashboard/warehouses/[id]`)
2. Go to "Representative Loading" tab
3. Select representative
4. Choose products and quantities
5. Server action: `loadStockToRep()`

### Code Example:
```typescript
export async function loadStockToRep(data: FormData) {
  'use server';
  
  const repId = data.get('repId') as string;
  const warehouseId = data.get('warehouseId') as string;
  const items = JSON.parse(data.get('items') as string);
  
  const rep = await prisma.user.findUnique({ where: { id: repId } });
  if (!rep || !rep.agencyId) throw new Error('Invalid representative');
  
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      // Check warehouse stock
      const sourceStock = await tx.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId: item.productId } }
      });
      
      if (!sourceStock || sourceStock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
      
      // Deduct from warehouse
      await tx.stock.update({
        where: { warehouseId_productId: { warehouseId, productId: item.productId } },
        data: { quantity: { decrement: item.quantity } }
      });
      
      // Add to rep's virtual warehouse
      await tx.stock.upsert({
        where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
        update: { quantity: { increment: item.quantity } },
        create: { warehouseId: repId, productId: item.productId, quantity: item.quantity }
      });
      
      // Log transaction
      await tx.transaction.create({
        data: {
          type: 'SALE',
          totalAmount: 0,
          userId: repId,
          agencyId: rep.agencyId,
          warehouseId: warehouseId,
          note: `تحميل للمندوب: ${rep.name}`
        }
      });
    }
  });
  
  revalidatePath('/dashboard/warehouses/[id]', 'page');
}
```

---

## 📊 Performing Representative Audit

### Steps:
1. Navigate to Rep details (`/dashboard/reps/[id]`)
2. View current stock
3. Enter remaining quantities
4. Select payment type
5. Choose to return or keep remaining stock
6. Server action: `finalizeRepAudit()`

### Code Example:
```typescript
export async function finalizeRepAudit(
  repId: string,
  warehouseId: string,
  auditItems: { productId: string, actualQuantity: number }[],
  paymentInfo: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number },
  remainingStockAction: 'RETURN' | 'KEEP' = 'RETURN'
) {
  'use server';
  
  const user = await prisma.user.findUnique({ where: { id: repId } });
  if (!user) throw new Error('Rep not found');
  
  await prisma.$transaction(async (tx) => {
    const soldItems = [];
    const repStocks = await tx.stock.findMany({ where: { warehouseId: repId } });
    
    // Calculate sold quantities
    for (const item of auditItems) {
      const currentQty = repStocks.find(s => s.productId === item.productId)?.quantity || 0;
      const soldQty = currentQty - item.actualQuantity;
      
      if (soldQty > 0) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const price = user.pricingType === 'WHOLESALE' 
          ? product?.wholesalePrice 
          : product?.retailPrice;
        
        soldItems.push({
          productId: item.productId,
          quantity: soldQty,
          price: Number(price),
          total: soldQty * Number(price)
        });
        
        // Deduct sold quantity from rep stock
        await tx.stock.update({
          where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
          data: { quantity: { decrement: soldQty } }
        });
      }
      
      // Handle remaining stock
      if (item.actualQuantity > 0 && remainingStockAction === 'RETURN') {
        // Return to warehouse
        await tx.stock.upsert({
          where: { warehouseId_productId: { warehouseId, productId: item.productId } },
          update: { quantity: { increment: item.actualQuantity } },
          create: { warehouseId, productId: item.productId, quantity: item.actualQuantity }
        });
        
        // Zero out rep stock
        await tx.stock.update({
          where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
          data: { quantity: 0 }
        });
      }
    }
    
    // Create sales transaction
    const totalAmount = soldItems.reduce((sum, item) => sum + item.total, 0);
    
    await tx.transaction.create({
      data: {
        type: 'SALE',
        totalAmount: totalAmount,
        userId: repId,
        agencyId: user.agencyId!,
        paymentType: paymentInfo.type,
        paidAmount: paymentInfo.paidAmount || 0,
        remainingAmount: totalAmount - (paymentInfo.paidAmount || 0),
        items: {
          create: soldItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });
  });
  
  revalidatePath('/dashboard/reps/[id]', 'page');
}
```

---

## 👤 Creating a New User

### Steps:
1. Navigate to Users page (`/dashboard/users`)
2. Click "إضافة مستخدم جديد"
3. Fill in username, password, role, agency
4. For sales reps, select pricing type
5. Server action: `createUser()`

### Code Example:
```typescript
export async function createUser(formData: FormData) {
  'use server';
  
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;
  const agencyId = formData.get('agencyId') as string;
  const name = formData.get('name') as string;
  const pricingType = formData.get('pricingType') as string;
  
  if (!username || !role || !password) {
    throw new Error('Username, Password, and Role are required');
  }
  
  await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        username,
        password,
        role,
        name,
        agencyId: agencyId || undefined,
        pricingType
      }
    });
    
    // If sales rep, create virtual warehouse
    if (role === 'SALES_REPRESENTATIVE') {
      await tx.warehouse.create({
        data: {
          id: user.id,
          name: `عهدة المندوب: ${name}`,
          agencyId: user.agencyId!
        }
      });
    }
  });
  
  revalidatePath('/dashboard/users');
}
```

---

## 🏪 Adding a New Customer

### Steps:
1. Navigate to Customers page (`/dashboard/customers`)
2. Click "إضافة عميل جديد"
3. Fill in name, phone, address
4. Select representative and agency
5. Server action: `createCustomer()`

### Code Example:
```typescript
export async function createCustomer(formData: FormData) {
  'use server';
  
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const representativeIds = formData.getAll('representativeIds') as string[];
  const agencyId = formData.get('agencyId') as string;
  
  if (!name || representativeIds.length === 0 || !agencyId) {
    throw new Error('Name, Representative, and Agency are required');
  }
  
  const representativeId = representativeIds[0];
  
  await prisma.customer.create({
    data: {
      name,
      phone,
      address,
      representativeId,
      agencyId
    }
  });
  
  revalidatePath('/dashboard/customers');
}
```

---

## 📈 Viewing Sales Reports

### Steps:
1. Navigate to Sales Reports (`/dashboard/reports/sales`)
2. Filter by agency, representative, or date range
3. View transaction details
4. Server action: `getSalesReports()` (if implemented)

### Code Example:
```typescript
// In page component
export default async function SalesReportsPage({
  searchParams
}: {
  searchParams: { agencyId?: string; repId?: string }
}) {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'SALE',
      ...(searchParams.agencyId && { agencyId: searchParams.agencyId }),
      ...(searchParams.repId && { userId: searchParams.repId })
    },
    include: {
      items: { include: { product: true } },
      user: true,
      agency: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return (
    <div>
      {/* Render reports */}
    </div>
  );
}
```

---

## 🔧 Modifying Database Schema

### Steps:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate` to update Prisma client
3. Run `npx prisma db push` to apply changes to database
4. Update TypeScript types if needed

### Example: Adding a field
```prisma
model Product {
  id             String  @id @default(uuid())
  name           String
  // Add new field
  sku            String? @unique
  // ... rest of fields
}
```

Then run:
```bash
npx prisma generate
npx prisma db push
```

---

## 🐛 Debugging Common Issues

### Issue: "URL_INVALID: The URL 'undefined' is not in a valid format"
**Solution**: Check `src/lib/db.ts` - ensure database URL is correct

### Issue: Stock quantity becomes negative
**Solution**: Add validation before stock operations:
```typescript
if (currentStock.quantity < requestedQty) {
  throw new Error('الرصيد غير كافٍ');
}
```

### Issue: Virtual warehouse not created for sales rep
**Solution**: Check `createUser()` - ensure transaction creates warehouse when `role === 'SALES_REPRESENTATIVE'`

### Issue: Revalidation not working
**Solution**: Ensure you're calling `revalidatePath()` with correct path:
```typescript
revalidatePath('/dashboard/products'); // Specific page
revalidatePath('/dashboard', 'layout'); // Entire dashboard
```

---

## 📝 Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Regenerate Prisma client
npx prisma generate

# Apply schema changes
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# View database content
node scripts/view-db-content.js
```

---

## 🗄️ Database Migrations & Seeding

### Creating a New Migration:
1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate`
3. If prompt for name: provide a descriptive name (e.g., `add_customer_notes`)

### Updating Locally After Someone Else's Changes:
1. Pull latest code
2. Run `npx prisma migrate deploy`
3. Run `npm run prisma:generate`

### Resetting and Re-seeding Case:
If you want to wipe the local DB and start fresh with the seed user:
1. Run `npm run prisma:reset`

### Modifying the Seed Script:
1. Edit `prisma/seed.ts`
2. Run `npm run prisma:seed` to apply changes (warning: skip if it creates duplicates)

---

**Last Updated**: January 2026
