'use server';

import prisma from "@/lib/db";
import { Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const g = global as any;

// Mock Authentication - Set to ADMIN for user management
// To test as sales rep, change to: { id: '3', role: 'SALES_REPRESENTATIVE' }

export async function setMockUser(id: string, role: string, agencyId?: string) {
    g.mockAuthUser = { id, role, agencyId };
    revalidatePath('/', 'layout');
}

// Debug helper
function safeStringify(obj: any) {
    try {
        const cache = new Set();
        return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (cache.has(value)) return '[Circular]';
                cache.add(value);
            }
            return value;
        }, 2);
    } catch {
        return 'Create Error Stringify Failed';
    }
}

export async function getCurrentUser() {
    const mock = g.mockAuthUser || {
        id: 'admin-id',
        role: 'ADMIN'
    };

    const dbUser = await prisma.user.findUnique({
        where: { id: mock.id },
        include: { agencies: true }
    });

    if (!dbUser) {
        return {
            id: mock.id as string,
            role: mock.role as string,
            agencyId: mock.agencyId as string | undefined,
            agencyIds: mock.agencyId ? [mock.agencyId] : []
        };
    }

    return {
        id: dbUser.id,
        role: dbUser.role,
        agencyId: dbUser.agencyId || undefined,
        agencyIds: dbUser.agencies.map(a => a.id),
        warehouseId: dbUser.warehouseId || undefined
    };
}

// --- Helper Functions ---

function generateId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

async function fileToBase64(file: File | null): Promise<string | null> {
    if (!file || file.size === 0) return null;

    try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        return `data:${file.type};base64,${base64}`;
    } catch (error) {
        console.error('[fileToBase64] Error converting file:', error);
        return null;
    }
}

// --- Agency Actions ---

export async function getAgencies() {
    const user = await getCurrentUser();

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        return await prisma.agency.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    return await prisma.agency.findMany({
        where: { id: user.agencyId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createAgency(formData: FormData) {
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name) throw new Error('Name is required');

    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error(`Unauthorized`);

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.agency.create({
        data: {
            name,
            image: imageBase64,
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateAgency(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name) throw new Error('Name is required');
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.agency.update({
        where: { id },
        data: {
            name,
            ...(imageBase64 ? { image: imageBase64 } : {})
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function deleteAgency(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error(`Unauthorized`);

    await prisma.$transaction(async (tx) => {
        // 1. Delete Stock (linked to products of this agency)
        await tx.stock.deleteMany({
            where: { product: { agencyId: id } }
        });

        // 2. Delete TransactionItems (linked to transactions of this agency)
        await tx.transactionItem.deleteMany({
            where: { transaction: { agencyId: id } }
        });

        // 3. Delete Transactions
        await tx.transaction.deleteMany({
            where: { agencyId: id }
        });

        // 4. Delete Products
        await tx.product.deleteMany({
            where: { agencyId: id }
        });

        // 5. Delete Customers
        await tx.customer.deleteMany({
            where: { agencyId: id }
        });

        // 6. Delete AccountRecords
        await tx.accountRecord.deleteMany({
            where: { agencyId: id }
        });

        // 7. Unlink Users (Set agencyId to null if this was their primary agency)
        await tx.user.updateMany({
            where: { agencyId: id },
            data: { agencyId: null }
        });

        // Also remove from UserAgencies implicit table if applicable (many-to-many)
        // Note: For many-to-many relations, disconnect is handled by deleting the Agency.

        // 8. Delete Warehouses
        await tx.warehouse.deleteMany({
            where: { agencyId: id }
        });

        // 9. Finally delete the Agency
        await tx.agency.delete({
            where: { id }
        });
    });

    revalidatePath('/dashboard', 'layout');
}

export async function resetAllData() {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.$transaction([
        prisma.transactionItem.deleteMany(),
        prisma.transaction.deleteMany(),
        prisma.stock.deleteMany(),
        prisma.product.deleteMany(),
        prisma.customer.deleteMany(),
        prisma.accountRecord.deleteMany(),
        prisma.bankTransaction.deleteMany(),
        prisma.installment.deleteMany(),
        prisma.loan.deleteMany(),
        prisma.warehouse.deleteMany(),
        prisma.user.updateMany({
            data: { agencyId: null, warehouseId: null }
        })
    ]);

    revalidatePath('/dashboard', 'layout');
    return { success: true };
}

// --- Warehouse Actions ---

export async function getWarehouses() {
    const user = await getCurrentUser();

    let warehouses: any[];
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        warehouses = await prisma.warehouse.findMany({
            include: { agency: true }
        });
    } else {
        const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (fullUser?.agencyId) {
            // If it's a warehouse keeper with a specific assigned warehouse, only show that one
            if (user.role === 'WAREHOUSE_KEEPER' && fullUser.warehouseId) {
                warehouses = await prisma.warehouse.findMany({
                    where: { id: fullUser.warehouseId },
                    include: { agency: true }
                });
            } else {
                warehouses = await prisma.warehouse.findMany({
                    where: { agencyId: fullUser.agencyId },
                    include: { agency: true }
                });
            }
        } else {
            warehouses = [];
        }
    }

    // Filter out virtual representative warehouses from the main list
    return warehouses.filter(w => !w.name.startsWith('عهدة المندوب:'));
}

export async function getWarehouse(id: string) {
    return await prisma.warehouse.findUnique({
        where: { id },
        include: { agency: true }
    });
}

export async function createWarehouse(formData: FormData) {
    const name = formData.get('name') as string;
    const agencyId = formData.get('agencyId') as string;

    if (!name || !agencyId) throw new Error('Name and Agency are required');
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    await prisma.warehouse.create({
        data: {
            name,
            agencyId,
        }
    });

    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/warehouses', 'page');
}

export async function deleteWarehouse(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    await prisma.$transaction(async (tx) => {
        // 1. Delete associated stock records
        await tx.stock.deleteMany({
            where: { warehouseId: id }
        });

        // 2. Unlink users from this warehouse
        await tx.user.updateMany({
            where: { warehouseId: id },
            data: { warehouseId: null }
        });

        // 3. Unlink transactions from this warehouse
        await tx.transaction.updateMany({
            where: { warehouseId: id },
            data: { warehouseId: null }
        });

        // 4. Finally delete the warehouse
        await tx.warehouse.delete({
            where: { id }
        });
    });

    revalidatePath('/dashboard', 'layout');
}

// --- User Actions ---

export async function getUsers() {
    const user = await getCurrentUser();

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        return await prisma.user.findMany({
            include: { agency: true, agencies: true }
        });
    }

    // Restricted roles see users in their agencies
    return await prisma.user.findMany({
        where: { agencies: { some: { id: { in: (user as any).agencyIds } } } },
        include: { agency: true, agencies: true }
    });
}

export async function getAllUsers() {
    return await prisma.user.findMany({
        include: { agency: true }
    });
}

export async function createUser(formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as Role;
    const agencyIds = formData.getAll('agencyId') as string[];
    const name = formData.get('name') as string;
    const pricingType = formData.get('pricingType') as string;
    const imageFile = formData.get('image') as File | null;

    // Permission check
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
        throw new Error('Unauthorized: Only Admins and Managers can create users');
    }

    if (!username || !role || !password) {
        throw new Error('Username, Password, and Role are required');
    }

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                username,
                password,
                role,
                name,
                agencyId: agencyIds.length > 0 ? agencyIds[0] : null,
                pricingType,
                image: imageBase64,
                agencies: {
                    connect: agencyIds.filter(id => id !== '').map(id => ({ id }))
                }
            }
        });

        // If user is a sales rep, create a virtual warehouse for them
        if (role === 'SALES_REPRESENTATIVE') {
            await tx.warehouse.create({
                data: {
                    id: user.id,
                    name: `عهدة المندوب: ${name}`,
                    agencyId: agencyIds.length > 0 ? agencyIds[0] : '',
                }
            });
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateUser(id: string, formData: FormData) {
    // Permission check
    const currentUser = await getCurrentUser();
    if (currentUser.role !== 'ADMIN') {
        throw new Error('Unauthorized: Only Admins can update users');
    }

    const username = formData.get('username') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as Role;
    const agencyIds = formData.getAll('agencyId') as string[];
    const pricingType = formData.get('pricingType') as string;
    const imageFile = formData.get('image') as File | null;

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.user.update({
        where: { id },
        data: {
            username,
            name,
            role,
            agencyId: agencyIds.length > 0 ? agencyIds[0] : null,
            pricingType,
            ...(imageBase64 ? { image: imageBase64 } : {}),
            agencies: {
                set: agencyIds.filter(id => id !== '').map(id => ({ id }))
            }
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function deleteUser(id: string) {
    const userRole = await getCurrentUser().then(u => u.role);
    if (userRole !== 'ADMIN') throw new Error('Unauthorized: Only Admins can delete users');

    await prisma.$transaction(async (tx) => {
        // Find if user is a rep to delete their virtual warehouse
        const user = await tx.user.findUnique({ where: { id } });

        // Delete stock and transactions first (due to FKs)
        await tx.stock.deleteMany({ where: { warehouseId: id } });

        // Delete virtual warehouse if it exists
        await tx.warehouse.deleteMany({ where: { id } });

        await tx.user.delete({ where: { id } });
    });

    revalidatePath('/dashboard', 'layout');
}

export async function toggleRepPricing(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) throw new Error('User not found');

    const newType = currentUser.pricingType === 'WHOLESALE' ? 'RETAIL' : 'WHOLESALE';

    await prisma.user.update({
        where: { id },
        data: { pricingType: newType }
    });

    revalidatePath('/dashboard', 'layout');
}

// --- Customer Actions ---

export async function getCustomers() {
    const user = await getCurrentUser();
    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';
    const isRestricted = !isAdminOrManager || user.role === 'SALES_RECORDER';

    let where: any = {};

    if (user.role === 'SALES_REPRESENTATIVE') {
        where = { representativeId: user.id };
    } else if (isRestricted) {
        where = { agencyId: { in: (user as any).agencyIds } };
    }

    const customers = await prisma.customer.findMany({
        where,
        include: {
            representative: true,
            agency: true,
            transactions: {
                select: {
                    remainingAmount: true
                }
            },
            accounts: {
                select: {
                    amount: true,
                    type: true
                }
            }
        } as any
    });

    // Calculate total debt for each customer
    return (customers as any[]).map(customer => {
        const transactionDebt = customer.transactions.reduce((sum: number, t: any) => sum + Number(t.remainingAmount || 0), 0);
        const accountDebt = customer.accounts.reduce((sum: number, acc: any) => {
            return sum + (acc.type === 'INCOME' ? Number(acc.amount) : -Number(acc.amount));
        }, 0);

        // Remove transactions and accounts to avoid serialization issues
        const { transactions, accounts, ...customerData } = customer;

        return {
            ...customerData,
            representativeIds: customer.representativeId ? [customer.representativeId] : [],
            totalDebt: transactionDebt + accountDebt
        };
    });
}

export async function getCustomerDetails(id: string) {
    if (!id) return null;
    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            representative: true,
            agency: true,
            accounts: {
                orderBy: { createdAt: 'desc' }
            },
            transactions: {
                include: {
                    user: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            } as any
        }
    });

    if (!customer) return null;

    const c = customer as any;
    const transactionDebt = c.transactions.reduce((sum: number, t: any) => sum + Number(t.remainingAmount || 0), 0);
    const accountDebt = c.accounts.reduce((sum: number, acc: any) => {
        // INCOME for a customer means they owed us that money (Initial Balance or manual debit)
        // EXPENSE for a customer would mean we paid/credited them (Manual credit)
        // For simplicity: INCOME = Debt (+), EXPENSE = Credit (-)
        return sum + (acc.type === 'INCOME' ? Number(acc.amount) : -Number(acc.amount));
    }, 0);

    const mergedLedger = [
        ...c.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            createdAt: t.createdAt,
            totalAmount: Number(t.totalAmount),
            paidAmount: Number(t.paidAmount || 0),
            remainingAmount: Number(t.remainingAmount || 0),
            note: t.note,
            paymentType: t.paymentType,
            items: t.items.map((item: any) => ({
                ...item,
                price: Number(item.price),
                cost: Number(item.cost || 0)
            }))
        })),
        ...c.accounts.map((acc: any) => ({
            id: acc.id,
            type: 'ACCOUNT_ADJUSTMENT',
            createdAt: acc.createdAt,
            totalAmount: acc.type === 'INCOME' ? Number(acc.amount) : 0,
            paidAmount: acc.type === 'EXPENSE' ? Number(acc.amount) : 0,
            remainingAmount: acc.type === 'INCOME' ? Number(acc.amount) : -Number(acc.amount),
            note: acc.description,
            paymentType: 'MANUAL',
            items: []
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const hasInitialBalance = (c.accounts || []).some((acc: any) => acc.category === 'رصيد بداية المدة');

    return {
        ...customer,
        totalDebt: transactionDebt + accountDebt,
        transactions: mergedLedger, // Reusing transactions name for UI compatibility
        hasInitialBalance
    };
}

export async function getRepCustomers(repId: string) {
    return await prisma.customer.findMany({
        where: { representativeId: repId },
        include: { representative: true, agency: true }
    });
}

export async function createCustomer(formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const representativeIds = formData.getAll('representativeIds') as string[];
    const agencyId = formData.get('agencyId') as string;

    if (!name || representativeIds.length === 0 || !agencyId) throw new Error('Name, Representative, and Agency are required');

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
    revalidatePath('/dashboard', 'layout');
}

export async function updateCustomer(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const representativeIds = formData.getAll('representativeIds') as string[];

    const representativeId = representativeIds[0];

    await prisma.customer.update({
        where: { id },
        data: {
            name,
            phone,
            address,
            representativeId
        }
    });
    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard', 'layout');
}

export async function deleteCustomer(id: string) {
    await prisma.customer.delete({ where: { id } });
    revalidatePath('/dashboard/customers');
}

// --- Product Actions ---

export async function getProducts() {
    const user = await getCurrentUser();

    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        return await (prisma as any).product.findMany({
            include: { agency: true, supplier: true },
            orderBy: { name: 'asc' }
        });
    }

    return await (prisma as any).product.findMany({
        where: { agencyId: user.agencyId },
        include: { agency: true, supplier: true },
        orderBy: { name: 'asc' }
    });
}

export async function createProduct(formData: FormData) {
    try {
        console.log('[createProduct] Starting product creation...');
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const barcode = formData.get('barcode') as string;
        const factoryPrice = Number(formData.get('factoryPrice'));
        const wholesalePrice = Number(formData.get('wholesalePrice'));
        const retailPrice = Number(formData.get('retailPrice'));
        const agencyId = formData.get('agencyId') as string;
        const supplierId = formData.get('supplierId') as string;
        const imageFile = formData.get('image') as File | null;

        if (!name || !agencyId || !supplierId) throw new Error('الاسم والتوكيل والمورد حقول مطلوبة');

        console.log(`[createProduct] Validating supplier ${supplierId} for agency ${agencyId}`);
        // Validate supplier-agency hierarchy
        const supplier = await (prisma as any).supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier || supplier.agencyId !== agencyId) {
            throw new Error('المورد المختار لا ينتمي إلى التوكيل المحدد');
        }

        const imageBase64 = await fileToBase64(imageFile);
        const unitsPerCarton = Number(formData.get('unitsPerCarton')) || 1;
        const unitFactoryPrice = Number(formData.get('unitFactoryPrice')) || 0;
        const unitWholesalePrice = Number(formData.get('unitWholesalePrice')) || 0;
        const unitRetailPrice = Number(formData.get('unitRetailPrice')) || 0;

        console.log('[createProduct] Creating product in database...');
        const product = await (prisma as any).product.create({
            data: {
                name,
                description,
                barcode: barcode || undefined,
                factoryPrice: new Decimal(factoryPrice),
                wholesalePrice: new Decimal(wholesalePrice),
                retailPrice: new Decimal(retailPrice),
                agencyId,
                supplierId,
                image: imageBase64,
                unitsPerCarton,
                unitFactoryPrice: new Decimal(unitFactoryPrice),
                unitWholesalePrice: new Decimal(unitWholesalePrice),
                unitRetailPrice: new Decimal(unitRetailPrice),
            } as any
        });

        console.log(`[createProduct] Product created successfully: ${product.id}`);
        revalidatePath('/dashboard', 'layout');
    } catch (error) {
        console.error('[createProduct] Fatal Error:', error);
        throw error;
    }
}

export async function updateProduct(id: string, formData: FormData) {
    try {
        console.log(`[updateProduct] Starting update for product ${id}...`);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const barcode = formData.get('barcode') as string;
        const factoryPrice = Number(formData.get('factoryPrice'));
        const wholesalePrice = Number(formData.get('wholesalePrice'));
        const retailPrice = Number(formData.get('retailPrice'));
        const agencyId = formData.get('agencyId') as string;
        const supplierId = formData.get('supplierId') as string;
        const imageFile = formData.get('image') as File | null;

        if (!name || !agencyId || !supplierId) throw new Error('الاسم والتوكيل والمورد حقول مطلوبة');

        console.log(`[updateProduct] Validating supplier ${supplierId} for agency ${agencyId}`);
        // Validate supplier-agency hierarchy
        const supplier = await (prisma as any).supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier || supplier.agencyId !== agencyId) {
            throw new Error('المورد المختار لا ينتمي إلى التوكيل المحدد');
        }

        const imageBase64 = await fileToBase64(imageFile);
        const unitsPerCarton = Number(formData.get('unitsPerCarton')) || 1;
        const unitFactoryPrice = Number(formData.get('unitFactoryPrice')) || 0;
        const unitWholesalePrice = Number(formData.get('unitWholesalePrice')) || 0;
        const unitRetailPrice = Number(formData.get('unitRetailPrice')) || 0;

        console.log('[updateProduct] Updating product in database...');
        await (prisma as any).product.update({
            where: { id },
            data: {
                name,
                description,
                barcode: barcode || null,
                factoryPrice: new Decimal(factoryPrice),
                wholesalePrice: new Decimal(wholesalePrice),
                retailPrice: new Decimal(retailPrice),
                agencyId,
                supplierId,
                unitsPerCarton,
                unitFactoryPrice: new Decimal(unitFactoryPrice),
                unitWholesalePrice: new Decimal(unitWholesalePrice),
                unitRetailPrice: new Decimal(unitRetailPrice),
                ...(imageBase64 ? { image: imageBase64 } : {})
            } as any
        });

        console.log(`[updateProduct] Product ${id} updated successfully`);
        revalidatePath('/dashboard', 'layout');
    } catch (error) {
        console.error('[updateProduct] Fatal Error:', error);
        throw error;
    }
}

export async function deleteProduct(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

    await prisma.product.delete({ where: { id } });
    revalidatePath('/dashboard', 'layout');
}

// --- Stock Actions ---

export async function getStocks() {
    return await prisma.stock.findMany({
        include: { product: true, warehouse: true }
    });
}

export async function updateStock(
    warehouseId: string,
    productId: string,
    quantity: number,
    note?: string,
    factoryPrice?: number,
    updateBasePrice?: boolean,
    wholesalePrice?: number,
    retailPrice?: number
) {
    const existingStock = await prisma.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } }
    });

    const previousQuantity = existingStock?.quantity || 0;
    const quantityChange = quantity - previousQuantity;

    // Get warehouse and user info for transaction logging
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    const currentUser = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
        // Update stock
        await tx.stock.upsert({
            where: { warehouseId_productId: { warehouseId, productId } },
            update: { quantity },
            create: { warehouseId, productId, quantity }
        });

        // Update product prices if requested
        if (updateBasePrice) {
            await tx.product.update({
                where: { id: productId },
                data: {
                    factoryPrice: factoryPrice,
                    wholesalePrice: wholesalePrice,
                    retailPrice: retailPrice,
                }
            });
        }

        // Log transaction if there's a quantity change
        if (quantityChange !== 0 && warehouse?.agencyId) {
            const transactionType = quantityChange > 0 ? 'PURCHASE' : 'SALE';
            const absChange = Math.abs(quantityChange);

            await tx.transaction.create({
                data: {
                    type: transactionType,
                    totalAmount: factoryPrice ? absChange * factoryPrice : 0,
                    userId: currentUser.id,
                    agencyId: warehouse.agencyId,
                    warehouseId: warehouseId,
                    note: note || (quantityChange > 0 ? `زيادة مخزون: +${absChange}` : `نقص مخزون: -${absChange}`),
                    items: {
                        create: [{
                            productId: productId,
                            quantity: absChange,
                            price: factoryPrice || 0,
                            cost: factoryPrice || 0
                        }]
                    }
                }
            });
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function supplyStock(
    warehouseId: string,
    productId: string,
    addedQuantity: number,
    factoryPrice?: number,
    updateBasePrice?: boolean,
    wholesalePrice?: number,
    retailPrice?: number
) {
    if (addedQuantity <= 0) throw new Error("Quantity must be greater than zero");

    const currentStockRecord = await prisma.stock.findUnique({
        where: { warehouseId_productId: { warehouseId, productId } }
    });
    const currentStock = currentStockRecord?.quantity || 0;
    const newQuantity = currentStock + addedQuantity;

    const note = `توريد كمية جديدة: +${addedQuantity}`;

    await updateStock(
        warehouseId,
        productId,
        newQuantity,
        note,
        factoryPrice,
        updateBasePrice,
        wholesalePrice,
        retailPrice
    );
}

export async function getTransactions(warehouseId: string) {
    return await prisma.transaction.findMany({
        where: { warehouseId },
        include: { items: { include: { product: true } }, user: true },
        orderBy: { createdAt: 'desc' }
    });
}

export async function performWarehouseAudit(
    warehouseId: string,
    auditData: { productId: string, actualQuantity: number }[]
) {
    try {
        await prisma.$transaction(async (tx) => {
            for (const data of auditData) {
                await tx.stock.upsert({
                    where: { warehouseId_productId: { warehouseId, productId: data.productId } },
                    update: { quantity: data.actualQuantity },
                    create: { warehouseId, productId: data.productId, quantity: data.actualQuantity }
                });
            }
        });
        revalidatePath('/dashboard/warehouses/[id]', 'page');
        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// --- Sales Representative Actions ---

export async function getRepStocks(repId: string) {
    return await prisma.stock.findMany({
        where: { warehouseId: repId },
        include: { product: true }
    });
}

export async function getAllRepStocks() {
    // Get all sales representative IDs
    const reps = await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' },
        select: { id: true }
    });

    const repIds = reps.map(r => r.id);

    // Get stock records where warehouseId is a rep ID
    return await prisma.stock.findMany({
        where: { warehouseId: { in: repIds } },
        include: { product: true }
    });
}

export async function loadStockToRep(data: FormData) {
    const repId = data.get('repId') as string;
    const warehouseId = data.get('warehouseId') as string;
    const itemsJson = data.get('items') as string;

    if (!repId || !warehouseId || !itemsJson) throw new Error("Invalid Data");

    // Expecting items to have { productId: string, cartons: number, units: number, quantity: number (total) }
    let items: { productId: string; cartons?: number; units?: number; quantity: number }[] = JSON.parse(itemsJson);
    if (items.length === 0) throw new Error("No items to load");

    const rep = await prisma.user.findUnique({ where: { id: repId } });
    if (!rep) throw new Error("Representative not found");
    if (!rep.agencyId) throw new Error("Representative is not assigned to an agency");

    await prisma.$transaction(async (tx) => {
        let grandTotal = 0;
        const transactionItems = [];

        for (const item of items) {
            if (item.quantity <= 0) continue;

            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) throw new Error(`Product not found: ${item.productId}`);

            // 1. Check if source stock exists and has enough quantity
            const sourceStock = await tx.stock.findUnique({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } }
            });

            if (!sourceStock || sourceStock.quantity < item.quantity) {
                throw new Error(`الرصيد غير كافٍ للصنف: ${product.name}`);
            }

            // 2. Decrement from source warehouse
            await tx.stock.update({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                data: { quantity: { decrement: item.quantity } }
            });

            // 3. Increment for representative
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                update: { quantity: { increment: item.quantity } },
                create: { warehouseId: repId, productId: item.productId, quantity: item.quantity }
            });

            // Determine pricing based on rep type
            const pricing = rep.pricingType === 'WHOLESALE'
                ? { carton: Number(product.wholesalePrice), unit: Number(product.unitWholesalePrice) }
                : { carton: Number(product.retailPrice), unit: Number(product.unitRetailPrice) };

            // Calculate cost for this line item based on units and cartons
            const cartons = item.cartons || 0;
            const units = item.units || 0;

            const itemTotalValue = (cartons * pricing.carton) + (units * pricing.unit);
            grandTotal += itemTotalValue;

            // Store the effective unit price in the transaction item
            // Since quantity is in units, price MUST be unit price for (qty * price) to be correct
            const effectiveUnitPrice = item.quantity > 0 ? (itemTotalValue / item.quantity) : 0;

            transactionItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: effectiveUnitPrice,
                cost: Number(product.unitFactoryPrice || 0)
            });
        }

        // 4. Record Transaction with real calculated total
        await tx.transaction.create({
            data: {
                type: 'SALE', // Warehouse deduction
                totalAmount: grandTotal,
                userId: repId,
                agencyId: rep.agencyId!,
                warehouseId: warehouseId,
                note: `تحميل للمندوب: ${rep.name}`,
                items: {
                    create: transactionItems
                }
            }
        });
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateRepStock(repId: string, productId: string, actualQuantity: number) {
    await prisma.stock.upsert({
        where: { warehouseId_productId: { warehouseId: repId, productId } },
        update: { quantity: actualQuantity },
        create: { warehouseId: repId, productId, quantity: actualQuantity }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function finalizeRepAudit(
    repId: string,
    warehouseId: string,
    auditItems: { productId: string, actualQuantity: number }[],
    paymentInfo: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number },
    remainingStockAction: 'RETURN' | 'KEEP' = 'RETURN'
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: repId } });
        if (!user) throw new Error("Rep not found");

        const result = await prisma.$transaction(async (tx) => {
            const soldItems: any[] = [];
            const repStocks = await tx.stock.findMany({ where: { warehouseId: repId } });

            const returnedItems: any[] = [];
            for (const item of auditItems) {
                const currentQty = repStocks.find(s => s.productId === item.productId)?.quantity || 0;
                const soldQty = currentQty - item.actualQuantity;

                if (soldQty > 0) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) continue;

                    const upc = Number(product.unitsPerCarton) || 1;
                    const pricing = user.pricingType === 'WHOLESALE'
                        ? { carton: Number(product.wholesalePrice), unit: Number(product.unitWholesalePrice) }
                        : { carton: Number(product.retailPrice), unit: Number(product.unitRetailPrice) };

                    // Calculate sold value: full cartons first, then pieces
                    const soldCartons = Math.floor(soldQty / upc);
                    const soldUnitsRemaining = soldQty % upc;
                    const totalSoldRowValue = (soldCartons * pricing.carton) + (soldUnitsRemaining * pricing.unit);

                    // Store effective unit price (total/quantity)
                    const effectiveUnitPrice = soldQty > 0 ? (totalSoldRowValue / soldQty) : 0;

                    soldItems.push({
                        productId: item.productId,
                        productName: product.name || "منتج غير معروف",
                        quantity: soldQty,
                        price: effectiveUnitPrice,
                        total: totalSoldRowValue
                    });

                    await tx.stock.update({
                        where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                        data: { quantity: { decrement: soldQty } }
                    });
                }

                if (item.actualQuantity > 0 && remainingStockAction === 'RETURN') {
                    returnedItems.push({
                        productId: item.productId,
                        quantity: item.actualQuantity
                    });

                    // Upsert to Warehouse (Target)
                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                        update: { quantity: { increment: item.actualQuantity } },
                        create: { warehouseId, productId: item.productId, quantity: item.actualQuantity }
                    });

                    // Update Rep Stock (Source) - Only if record exists (currentQty > 0)
                    if (currentQty > 0) {
                        await tx.stock.update({
                            where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                            data: { quantity: 0 }
                        });
                    }
                } else if (item.actualQuantity === 0) {
                    // Only update if record actually exists
                    if (currentQty > 0) {
                        await tx.stock.update({
                            where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                            data: { quantity: 0 }
                        });
                    }
                }
            }

            // Log returned items as a transaction for the warehouse
            if (returnedItems.length > 0) {
                await tx.transaction.create({
                    data: {
                        type: 'PURCHASE', // Increase warehouse stock
                        totalAmount: 0,
                        userId: repId,
                        agencyId: user.agencyId!,
                        warehouseId: warehouseId,
                        note: `مرتجع عهدة من المندوب: ${user.name}`,
                        items: {
                            create: returnedItems.map(ri => ({
                                productId: ri.productId,
                                quantity: ri.quantity,
                                price: 0
                            }))
                        }
                    }
                });
            }

            if (soldItems.length > 0) {
                const totalAmount = soldItems.reduce((sum, item) => sum + item.total, 0);
                const transaction = await tx.transaction.create({
                    data: {
                        type: 'SALE',
                        totalAmount,
                        userId: repId,
                        agencyId: user.agencyId!,
                        paymentType: paymentInfo.type,
                        paidAmount: paymentInfo.paidAmount || 0,
                        remainingAmount: totalAmount - (paymentInfo.paidAmount || 0),
                        items: {
                            create: await Promise.all(soldItems.map(async si => {
                                const prod = await tx.product.findUnique({ where: { id: si.productId } });
                                return {
                                    productId: si.productId,
                                    quantity: si.quantity,
                                    price: si.price, // Already unit price
                                    cost: prod?.unitFactoryPrice || 0
                                };
                            }))
                        }
                    }
                });
                return { sessionId: transaction.id, soldItems: soldItems };
            }
            return { sessionId: null, soldItems: [] };
        });

        revalidatePath('/dashboard', 'layout');
        return {
            success: true,
            sessionId: result.sessionId,
            soldItems: result.soldItems
        };
    } catch (error) {
        console.error("finalizeRepAudit error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordSalesSession(
    repId: string,
    repName: string,
    items: any[],
    customerData?: { id: string, name: string },
    paymentInfo?: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number }
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: repId } });
        if (!user) throw new Error("Rep not found");

        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

        const transaction = await prisma.transaction.create({
            data: {
                type: 'SALE',
                totalAmount,
                userId: repId,
                agencyId: user.agencyId!,
                customerId: customerData?.id,
                paymentType: paymentInfo?.type || 'CASH',
                paidAmount: (paymentInfo?.type === 'CASH' ? totalAmount : (paymentInfo?.type === 'CREDIT' ? 0 : (paymentInfo?.paidAmount || 0))),
                remainingAmount: (paymentInfo?.type === 'CASH' ? 0 : (paymentInfo?.type === 'CREDIT' ? totalAmount : (totalAmount - (paymentInfo?.paidAmount || 0)))),
                items: {
                    create: await Promise.all(items.map(async item => {
                        const product = await prisma.product.findUnique({ where: { id: item.productId } });
                        return {
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price || 0,
                            cost: product?.unitFactoryPrice || 0
                        };
                    }))
                }
            }
        });

        revalidatePath('/dashboard/reports/sales');
        revalidatePath('/dashboard', 'layout');
        return { success: true, sessionId: transaction.id };
    } catch (error) {
        console.error("recordSalesSession error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordDirectSale(
    repId: string,
    customerId: string,
    items: { productId: string, quantity: number, price: number }[],
    paymentInfo: { type: 'CASH' | 'CREDIT' | 'PARTIAL', paidAmount?: number }
) {
    try {
        const user = await prisma.user.findUnique({ where: { id: repId } });
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!user || !customer) throw new Error("Invalid Rep or Customer");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct Stock from Rep
            for (const item of items) {
                await tx.stock.update({
                    where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                    data: { quantity: { decrement: item.quantity } }
                });
            }

            // 2. Record Session/Transaction
            const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    totalAmount,
                    userId: repId,
                    agencyId: user.agencyId!,
                    customerId: customerId,
                    paymentType: paymentInfo.type,
                    paidAmount: (paymentInfo.type === 'CASH' ? totalAmount : (paymentInfo.type === 'CREDIT' ? 0 : (paymentInfo.paidAmount || 0))),
                    remainingAmount: (paymentInfo.type === 'CASH' ? 0 : (paymentInfo.type === 'CREDIT' ? totalAmount : (totalAmount - (paymentInfo.paidAmount || 0)))),
                    items: {
                        create: await Promise.all(items.map(async item => {
                            const product = await prisma.product.findUnique({ where: { id: item.productId } });
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price: item.price,
                                cost: product?.unitFactoryPrice || 0
                            };
                        }))
                    }
                }
            });
            return { sessionId: transaction.id };
        });

        revalidatePath('/dashboard', 'layout');
        return { success: true, sessionId: result.sessionId };
    } catch (error) {
        console.error("recordDirectSale error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getSalesSessions(filters?: { repId?: string; startDate?: string; endDate?: string }) {
    const user = await getCurrentUser();

    return await prisma.transaction.findMany({
        where: {
            type: 'SALE',
            userId: user.role === 'SALES_REPRESENTATIVE' ? user.id : (filters?.repId && filters.repId !== "" ? filters.repId : undefined),
            createdAt: {
                gte: filters?.startDate && filters.startDate !== "" ? new Date(filters.startDate) : undefined,
                lte: filters?.endDate && filters.endDate !== "" ? new Date(filters.endDate) : undefined
            }
        },
        include: { user: true, customer: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    });
}

export async function recordDebtCollection(
    customerId: string,
    amount: number,
    note?: string,
    repId?: string // Optional repId to attribute some collections to a specific rep
) {
    try {
        const user = await getCurrentUser();
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new Error("Customer not found");

        const transaction = await prisma.transaction.create({
            data: {
                type: 'COLLECTION',
                totalAmount: 0,
                userId: repId || customer.representativeId || user.id, // Attribute to rep if provided or assigned
                agencyId: customer.agencyId,
                customerId: customerId,
                paymentType: 'CASH',
                paidAmount: amount,
                remainingAmount: -amount,
                note: note || "تحصيل مديونية"
            }
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath(`/dashboard/customers/${customerId}`);
        if (repId || customer.representativeId) {
            revalidatePath(`/dashboard/reps/${repId || customer.representativeId}`);
        }
        return { success: true, sessionId: transaction.id };
    } catch (error) {
        console.error("recordDebtCollection error:", error);
        return { success: false, error: String(error) };
    }
}

export async function recordAgencyPayment(
    agencyId: string,
    amount: number,
    note?: string
) {
    try {
        const user = await getCurrentUser();
        const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
        if (!agency) throw new Error("Agency not found");

        const transaction = await prisma.transaction.create({
            data: {
                type: 'SUPPLY_PAYMENT',
                totalAmount: 0,
                userId: user.id,
                agencyId: agencyId,
                paymentType: 'CASH',
                paidAmount: amount,
                remainingAmount: -amount,
                note: note || "سداد مديونية توريد"
            }
        });

        revalidatePath('/dashboard', 'layout');
        revalidatePath('/dashboard/accounts/reports/purchases');
        return { success: true, sessionId: transaction.id };
    } catch (error) {
        console.error("recordAgencyPayment error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getAgencyPurchases() {
    const user = await getCurrentUser();
    const isAdminOrManager = user.role === 'ADMIN' || user.role === 'MANAGER';

    const agencies = await prisma.agency.findMany({
        where: isAdminOrManager ? {} : { id: user.agencyId || undefined },
        include: {
            transactions: {
                where: { type: { in: ['PURCHASE', 'SUPPLY_PAYMENT'] } },
                include: {
                    user: true,
                    items: { include: { product: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    return agencies.map(agency => {
        const transactions = agency.transactions.map(t => ({
            ...t,
            totalAmount: Number(t.totalAmount || 0),
            paidAmount: Number(t.paidAmount || 0),
            remainingAmount: Number(t.remainingAmount || 0),
            items: t.items.map(item => ({
                ...item,
                price: Number(item.price),
                cost: Number(item.cost || 0)
            }))
        }));

        const totalPurchases = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
        const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
        const totalRemaining = transactions.reduce((sum, t) => sum + t.remainingAmount, 0);

        return {
            id: agency.id,
            name: agency.name,
            totalPurchases,
            totalPaid,
            totalRemaining,
            transactions
        };
    });
}

export async function updateSalesSession(
    id: string, updates: any) {
    try {
        await prisma.$transaction(async (tx) => {
            if (updates.items) {
                // Delete old items
                await tx.transactionItem.deleteMany({ where: { transactionId: id } });

                // Create new items
                await tx.transactionItem.createMany({
                    data: await Promise.all(updates.items.map(async (item: any) => {
                        const product = await prisma.product.findUnique({ where: { id: item.productId } });
                        return {
                            transactionId: id,
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            cost: product?.factoryPrice || 0
                        };
                    }))
                });

                // Calculate new total
                const totalAmount = updates.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

                // Fetch current session to get paidAmount for remainingAmount calculation
                const session = await tx.transaction.findUnique({ where: { id } });
                const paid = updates.paidAmount !== undefined ? updates.paidAmount : Number(session?.paidAmount || 0);

                await tx.transaction.update({
                    where: { id },
                    data: {
                        totalAmount,
                        paidAmount: paid,
                        remainingAmount: totalAmount - paid
                    }
                });
            } else if (updates.paidAmount !== undefined) {
                const session = await tx.transaction.findUnique({ where: { id } });
                const total = Number(session?.totalAmount || 0);
                await tx.transaction.update({
                    where: { id },
                    data: {
                        paidAmount: updates.paidAmount,
                        remainingAmount: total - updates.paidAmount
                    }
                });
            }
        });

        revalidatePath('/dashboard/reports/sales');
        revalidatePath('/dashboard', 'layout');
        return { success: true };
    } catch (error) {
        console.error("updateSalesSession error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getRepDebtBreakdown(repId: string) {
    const customers = await prisma.customer.findMany({
        where: { representativeId: repId },
        include: {
            transactions: {
                select: {
                    remainingAmount: true
                }
            }
        }
    });

    return customers.map(c => {
        const debt = c.transactions.reduce((sum, t) => sum + Number(t.remainingAmount || 0), 0);
        return {
            id: c.id,
            name: c.name,
            debt: debt
        };
    }).filter(c => c.debt !== 0);
}

export async function recordOpeningStock(formData: FormData) {
    try {
        const warehouseId = formData.get('warehouseId') as string;
        const productId = formData.get('productId') as string;
        const quantity = Number(formData.get('quantity'));
        const cost = Number(formData.get('cost') || 0);
        const date = formData.get('date') as string;

        if (!warehouseId || !productId || !quantity) throw new Error('بيانات غير مكتملة');

        const user = await getCurrentUser();
        const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) throw new Error("Warehouse not found");

        await prisma.$transaction(async (tx) => {
            // 1. Update/Upsert Stock
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId, productId } },
                update: { quantity: { increment: quantity } },
                create: { warehouseId, productId, quantity }
            });

            // 2. Record Transaction
            await (tx as any).transaction.create({
                data: {
                    type: 'INITIAL_STOCK' as any,
                    totalAmount: quantity * cost,
                    userId: user.id,
                    agencyId: warehouse.agencyId,
                    warehouseId: warehouseId,
                    paymentType: 'CASH',
                    paidAmount: 0,
                    remainingAmount: 0,
                    note: "بضاعة أول المدة",
                    createdAt: date ? new Date(date) : new Date(),
                    items: {
                        create: [{
                            productId: productId,
                            quantity: quantity,
                            price: cost,
                            cost: cost
                        }]
                    }
                } as any
            });
        });

        revalidatePath('/dashboard/warehouses/[id]', 'page');
        revalidatePath('/dashboard/warehouses', 'layout');
        return { success: true };
    } catch (error) {
        console.error("recordOpeningStock error:", error);
        return { success: false, error: String(error) };
    }
}
