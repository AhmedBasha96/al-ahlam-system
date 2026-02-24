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
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') throw new Error('Unauthorized');

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
