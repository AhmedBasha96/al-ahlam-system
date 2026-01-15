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

export async function getCurrentUser() {
    const currentUser = g.mockAuthUser || {
        id: 'admin-id',
        role: 'ADMIN'
    };

    return {
        id: currentUser.id as string,
        role: currentUser.role as string,
        agencyId: currentUser.agencyId as string | undefined
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
    return await prisma.agency.findMany({
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

    const productCount = await prisma.product.count({ where: { agencyId: id } });
    if (productCount > 0) throw new Error('لا يمكن حذف التوكيل لوجود منتجات مرتبطة به');

    await prisma.agency.delete({ where: { id } });
    revalidatePath('/dashboard', 'layout');
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
            warehouses = await prisma.warehouse.findMany({
                where: { agencyId: fullUser.agencyId },
                include: { agency: true }
            });
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
            include: { agency: true }
        });
    }
    // Non-managers only see themselves
    return await prisma.user.findMany({
        where: { id: user.id },
        include: { agency: true }
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
    const agencyId = formData.get('agencyId') as string;
    const name = formData.get('name') as string;
    const pricingType = formData.get('pricingType') as string;
    const imageFile = formData.get('image') as File | null;

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
                agencyId: agencyId && agencyId !== '' ? agencyId : undefined,
                pricingType,
                image: imageBase64
            }
        });

        // If user is a sales rep, create a virtual warehouse for them
        if (role === 'SALES_REPRESENTATIVE') {
            await tx.warehouse.create({
                data: {
                    id: user.id,
                    name: `عهدة المندوب: ${name}`,
                    agencyId: user.agencyId!,
                }
            });
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateUser(id: string, formData: FormData) {
    const username = formData.get('username') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as Role;
    const agencyId = formData.get('agencyId') as string;
    const pricingType = formData.get('pricingType') as string;
    const imageFile = formData.get('image') as File | null;

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.user.update({
        where: { id },
        data: {
            username,
            name,
            role,
            agencyId: agencyId && agencyId !== '' ? agencyId : null,
            pricingType,
            ...(imageBase64 ? { image: imageBase64 } : {})
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function deleteUser(id: string) {
    const userRole = await getCurrentUser().then(u => u.role);
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') throw new Error('Unauthorized');

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

    if (user.role === 'SALES_REPRESENTATIVE') {
        return await prisma.customer.findMany({
            where: { representativeId: user.id },
            include: { representative: true, agency: true }
        });
    }
    return await prisma.customer.findMany({
        include: { representative: true, agency: true }
    });
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
    return await prisma.product.findMany({
        include: { agency: true },
        orderBy: { name: 'asc' }
    });
}

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const barcode = formData.get('barcode') as string;
    const factoryPrice = Number(formData.get('factoryPrice'));
    const wholesalePrice = Number(formData.get('wholesalePrice'));
    const retailPrice = Number(formData.get('retailPrice'));
    const agencyId = formData.get('agencyId') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name || !agencyId) throw new Error('Name and Agency are required');

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.product.create({
        data: {
            name,
            description,
            barcode: barcode || undefined,
            factoryPrice,
            wholesalePrice,
            retailPrice,
            agencyId,
            image: imageBase64,
        }
    });

    revalidatePath('/dashboard', 'layout');
}

export async function updateProduct(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const barcode = formData.get('barcode') as string;
    const factoryPrice = Number(formData.get('factoryPrice'));
    const wholesalePrice = Number(formData.get('wholesalePrice'));
    const retailPrice = Number(formData.get('retailPrice'));
    const agencyId = formData.get('agencyId') as string;
    const imageFile = formData.get('image') as File | null;

    const imageBase64 = await fileToBase64(imageFile);

    await prisma.product.update({
        where: { id },
        data: {
            name,
            description,
            barcode: barcode || null,
            factoryPrice,
            wholesalePrice,
            retailPrice,
            agencyId,
            ...(imageBase64 ? { image: imageBase64 } : {})
        }
    });

    revalidatePath('/dashboard', 'layout');
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
                            price: factoryPrice || 0
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

    let items: { productId: string; quantity: number }[] = JSON.parse(itemsJson);
    if (items.length === 0) throw new Error("No items to load");

    const rep = await prisma.user.findUnique({ where: { id: repId } });
    if (!rep) throw new Error("Representative not found");
    if (!rep.agencyId) throw new Error("Representative is not assigned to an agency");

    await prisma.$transaction(async (tx) => {
        for (const item of items) {
            if (item.quantity <= 0) continue;

            // 1. Check if source stock exists and has enough quantity
            const sourceStock = await tx.stock.findUnique({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } }
            });

            if (!sourceStock || sourceStock.quantity < item.quantity) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                throw new Error(`الرصيد غير كافٍ للصنف: ${product?.name || item.productId}`);
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

            // 4. Record Transaction
            await tx.transaction.create({
                data: {
                    type: 'SALE', // Change from PURCHASE to SALE to represent warehouse deduction
                    totalAmount: 0,
                    userId: repId,
                    agencyId: rep.agencyId!,
                    warehouseId: warehouseId,
                    note: `تحميل للمندوب: ${rep.name}`,
                    items: {
                        create: [{
                            productId: item.productId,
                            quantity: item.quantity,
                            price: 0
                        }]
                    }
                }
            });
        }
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
                    const price = user.pricingType === 'WHOLESALE' ? product?.wholesalePrice : product?.retailPrice;

                    soldItems.push({
                        productId: item.productId,
                        productName: product?.name || "منتج غير معروف",
                        quantity: soldQty,
                        price: Number(price),
                        total: soldQty * Number(price)
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

                    await tx.stock.upsert({
                        where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                        update: { quantity: { increment: item.actualQuantity } },
                        create: { warehouseId, productId: item.productId, quantity: item.actualQuantity }
                    });

                    await tx.stock.update({
                        where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                        data: { quantity: 0 }
                    });
                } else if (item.actualQuantity === 0) {
                    await tx.stock.update({
                        where: { warehouseId_productId: { warehouseId: repId, productId: item.productId } },
                        data: { quantity: 0 }
                    });
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
                const totalAmount = soldItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
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
                            create: soldItems.map(si => ({
                                productId: si.productId,
                                quantity: si.quantity,
                                price: si.price
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
                paidAmount: paymentInfo?.paidAmount || 0,
                remainingAmount: totalAmount - (paymentInfo?.paidAmount || 0),
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price || 0
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
                    paidAmount: paymentInfo.paidAmount || 0,
                    remainingAmount: totalAmount - (paymentInfo.paidAmount || 0),
                    items: {
                        create: items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
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

export async function updateSalesSession(id: string, updates: any) {
    try {
        await prisma.$transaction(async (tx) => {
            if (updates.items) {
                // Delete old items
                await tx.transactionItem.deleteMany({ where: { transactionId: id } });

                // Create new items
                await tx.transactionItem.createMany({
                    data: updates.items.map((item: any) => ({
                        transactionId: id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
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
