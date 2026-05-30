import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/actions';
import { JournalEntryType } from '@prisma/client';

/**
 * Records a financial movement in the JournalEntry table.
 * Used across the system to track cash flow.
 */
export async function recordJournalEntry(tx: any, data: {
    amount: number;
    type: 'DEBIT' | 'CREDIT';
    description: string;
    referenceId?: string;
    referenceType?: string;
    agencyId?: string | null;
    userId: string;
}) {
    return await tx.journalEntry.create({
        data: {
            amount: data.amount,
            type: data.type as JournalEntryType,
            description: data.description,
            referenceId: data.referenceId,
            referenceType: data.referenceType,
            agencyId: data.agencyId,
            userId: data.userId,
            status: 'CONFIRMED'
        }
    });
}

/**
 * Creates a new purchase invoice.
 * Supports carton-only entry, per-item discounts/taxes, and image upload.
 */
export async function createPurchaseInvoice(formData: FormData) {
    const warehouseId = formData.get('warehouseId') as string;
    const itemsJson = formData.get('items') as string;
    const paidAmount = Number(formData.get('paidAmount') || 0);
    const note = formData.get('note') as string;
    const dateStr = formData.get('date') as string;
    const supplierId = formData.get('supplierId') as string;
    const imageFile = formData.get('image') as File | null;

    if (!warehouseId) {
        throw new Error('يرجى اختيار المخزن أولاً');
    }

    if (!itemsJson || itemsJson === '[]') {
        throw new Error('يرجى إضافة صنف واحد على الأقل بكمية صحيحة');
    }

    let items: { 
        productId: string, 
        quantity: number, 
        cost: number,
        discountPercentage?: number,
        taxPercentage?: number
    }[] = [];

    try {
        items = JSON.parse(itemsJson);
    } catch (e) {
        throw new Error('حدث خطأ في قراءة بيانات الأصناف');
    }

    if (items.length === 0) throw new Error('لا توجد أصناف في الفاتورة');

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error('المخزن غير موجود');

    const user = await getCurrentUser();

    // Calculate total amount accounting for discount and tax per item
    const totalAmount = items.reduce((sum, item) => {
        const itemBase = item.quantity * item.cost;
        const discountAmount = itemBase * (Number(item.discountPercentage || 0) / 100);
        const taxAmount = itemBase * (Number(item.taxPercentage || 0) / 100);
        return sum + (itemBase - discountAmount + taxAmount);
    }, 0);

    // Convert image to Base64 if provided
    let imageUrl: string | null = null;
    if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        imageUrl = `data:${imageFile.type};base64,${base64}`;
    }

    const transaction = await prisma.$transaction(async (tx) => {
        // 1. Update Stock
        for (const item of items) {
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                update: { quantity: { increment: item.quantity } },
                create: { warehouseId, productId: item.productId, quantity: item.quantity }
            });
        }

        // 2. Create Transaction
        const purchase = await (tx as any).transaction.create({
            data: {
                type: 'PURCHASE',
                totalAmount,
                paidAmount,
                remainingAmount: totalAmount - paidAmount,
                userId: user.id,
                agencyId: warehouse.agencyId,
                warehouseId,
                supplierId: supplierId || null,
                note: note || 'فاتورة مشتريات',
                createdAt: dateStr ? new Date(dateStr) : new Date(),
                imageUrl: imageUrl,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.cost,
                        cost: item.cost,
                        discountPercentage: Number(item.discountPercentage || 0),
                        taxPercentage: Number(item.taxPercentage || 0)
                    }))
                }
            }
        });

        // 3. Record Journal Entry (If cash paid)
        if (paidAmount > 0) {
            await recordJournalEntry(tx, {
                amount: paidAmount,
                type: 'CREDIT',
                description: `سداد نقدي فاتورة مشتريات رقم ${purchase.id}`,
                referenceId: purchase.id,
                referenceType: 'PURCHASE',
                agencyId: warehouse.agencyId,
                userId: user.id
            });
        }

        return purchase;
    }, { timeout: 15000 });

    revalidatePath('/dashboard/accounts', 'layout');
    return { success: true, id: transaction.id };
}

/**
 * Fetches purchase invoices for a given agency.
 */
export async function getPurchaseInvoices(agencyIdFilter?: string) {
    const whereClause: any = { type: 'PURCHASE' };
    if (agencyIdFilter) whereClause.agencyId = agencyIdFilter;
    
    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
            user: { select: { name: true } },
            warehouse: { select: { name: true } },
            supplier: { select: { name: true } },
            items: { include: { product: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return transactions.map(t => ({
        ...t,
        totalAmount: Number(t.totalAmount),
        paidAmount: Number(t.paidAmount || 0),
        remainingAmount: Number(t.remainingAmount || 0),
        items: t.items.map(item => ({
            ...item,
            price: Number(item.price),
            cost: Number(item.cost || 0),
            discountPercentage: Number(item.discountPercentage || 0),
            taxPercentage: Number(item.taxPercentage || 0)
        }))
    }));
}
