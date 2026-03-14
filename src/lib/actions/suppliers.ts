'use server';

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/actions";

export async function getSuppliers(agencyId?: string) {
    const user = await getCurrentUser();

    let where: any = {};
    if (agencyId) {
        where.agencyId = agencyId;
    } else if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        where.agencyId = user.agencyId;
    }

    return await (prisma as any).supplier.findMany({
        where,
        include: {
            agency: true,
            _count: {
                select: {
                    products: true,
                    transactions: true,
                    accounts: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export async function createSupplier(formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const agencyId = formData.get('agencyId') as string;

    if (!name || !agencyId) throw new Error('Name and Agency are required');

    await (prisma as any).supplier.create({
        data: {
            name,
            phone,
            address,
            agencyId
        }
    });

    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard', 'layout');
}

export async function updateSupplier(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    if (!name) throw new Error('Name is required');

    await (prisma as any).supplier.update({
        where: { id },
        data: {
            name,
            phone,
            address
        }
    });

    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard', 'layout');
}

export async function deleteSupplier(id: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') throw new Error('Unauthorized: Admin access required');

    await (prisma as any).supplier.delete({
        where: { id }
    });

    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard', 'layout');
}

export async function getSupplierDetails(id: string) {
    const supplier = await (prisma as any).supplier.findUnique({
        where: { id },
        include: {
            agency: true,
            products: true,
            accounts: {
                orderBy: { createdAt: 'desc' }
            },
            transactions: {
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            }
        }
    });

    if (!supplier) return null;

    const hasInitialBalance = supplier.accounts.some((acc: any) => acc.category === 'رصيد بداية المدة');

    return {
        ...supplier,
        hasInitialBalance
    };
}

export async function createSupplierReturnRequest(
    supplierId: string,
    warehouseId: string,
    items: { productId: string, quantity: number, price: number }[],
    totalAmount: number
) {
    const user = await getCurrentUser();

    await prisma.$transaction(async (tx) => {
        // Find warehouse to get agencyId if user doesn't have one (e.g. Admin)
        const warehouse = await tx.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) throw new Error("Warehouse not found");

        const targetAgencyId = user.agencyId || warehouse.agencyId;

        // 1. Create PENDING transaction
        await tx.transaction.create({
            data: {
                type: 'RETURN_OUT',
                status: 'PENDING',
                totalAmount,
                userId: user.id,
                agencyId: targetAgencyId,
                supplierId: supplierId,
                warehouseId: warehouseId,
                paymentType: 'CREDIT',
                remainingAmount: -totalAmount,
                items: {
                    create: await Promise.all(items.map(async (item: any) => {
                        const product = await tx.product.findUnique({ where: { id: item.productId } });
                        return {
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            originalPrice: item.price,
                            cost: product?.unitFactoryPrice || 0
                        };
                    }))
                }
            }
        });

        // 2. Decrement Stock immediately
        for (const item of items) {
            await tx.stock.update({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                data: { quantity: { decrement: item.quantity } }
            });
        }
    });

    revalidatePath(`/dashboard/suppliers/${supplierId}`);
    revalidatePath('/dashboard/accounts/approvals');
}

export async function approveSupplierReturn(transactionId: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'ACCOUNTANT') {
        throw new Error('Unauthorized');
    }

    await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'ACTIVE' }
    });

    revalidatePath('/dashboard/accounts/approvals');
    revalidatePath('/dashboard/suppliers');
}

export async function rejectSupplierReturn(transactionId: string) {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'ACCOUNTANT') {
        throw new Error('Unauthorized');
    }

    await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: { items: true }
        });

        if (!transaction || transaction.status !== 'PENDING') {
            throw new Error('Invalid transaction state');
        }

        // 1. Mark as CANCELED
        await tx.transaction.update({
            where: { id: transactionId },
            data: { status: 'CANCELED' }
        });

        // 2. Increment Stock back to warehouse
        if (transaction.warehouseId) {
            for (const item of transaction.items) {
                await tx.stock.upsert({
                    where: { warehouseId_productId: { warehouseId: transaction.warehouseId, productId: item.productId } },
                    update: { quantity: { increment: item.quantity } },
                    create: { warehouseId: transaction.warehouseId, productId: item.productId, quantity: item.quantity }
                });
            }
        }
    });

    revalidatePath('/dashboard/accounts/approvals');
    revalidatePath('/dashboard/suppliers');
}