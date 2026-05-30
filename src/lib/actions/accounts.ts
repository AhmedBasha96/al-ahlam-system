'use server';

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

/**
 * Creates an INCOME or EXPENSE account record.
 * Used as a form action from income/expenses pages.
 */
export async function createAccountRecord(formData: FormData) {
    const type = formData.get('type') as string; // 'INCOME' | 'EXPENSE'
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const category = formData.get('category') as string || null;
    const agencyId = formData.get('agencyId') as string;
    const supplierId = formData.get('supplierId') as string;
    const dateStr = formData.get('date') as string;
    const imageFile = formData.get('image') as File | null;

    if (!amount || amount <= 0) throw new Error('يرجى إدخال مبلغ صحيح');
    if (!description) throw new Error('يرجى إدخال البيان');

    const user = await getCurrentUser();

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

    const recordType = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const resolvedAgencyId = agencyId && agencyId !== 'GENERAL' ? agencyId : null;
    const resolvedSupplierId = supplierId && supplierId !== 'NONE' ? supplierId : null;

    await prisma.$transaction(async (tx) => {
        const record = await tx.accountRecord.create({
            data: {
                type: recordType,
                amount,
                description,
                category,
                agencyId: resolvedAgencyId,
                userId: user.id,
                supplierId: resolvedSupplierId,
                createdAt: dateStr ? new Date(dateStr) : new Date(),
                imageUrl,
            }
        });

        // Record journal entry
        await recordJournalEntry(tx, {
            amount,
            type: recordType === 'INCOME' ? 'DEBIT' : 'CREDIT',
            description: `${recordType === 'INCOME' ? 'إيراد' : 'مصروف'}: ${description}`,
            referenceId: record.id,
            referenceType: recordType,
            agencyId: resolvedAgencyId,
            userId: user.id
        });

        return record;
    }, { timeout: 10000 });

    revalidatePath('/dashboard/accounts', 'layout');
}

/**
 * Updates an existing account record (amount, description, category).
 */
export async function updateAccountRecord(
    id: string,
    updates: { amount?: number; description?: string; category?: string }
) {
    if (!id) throw new Error('معرف السجل مطلوب');

    const data: any = {};
    if (updates.amount !== undefined) data.amount = updates.amount;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.category !== undefined) data.category = updates.category;

    await prisma.accountRecord.update({
        where: { id },
        data
    });

    revalidatePath('/dashboard/accounts', 'layout');
    return { success: true };
}

/**
 * Deletes an account record by ID.
 */
export async function deleteAccountRecord(id: string) {
    if (!id) throw new Error('معرف السجل مطلوب');

    await prisma.accountRecord.delete({
        where: { id }
    });

    revalidatePath('/dashboard/accounts', 'layout');
    return { success: true };
}

/**
 * Fetches all agencies (id + name).
 */
export async function getAgencies() {
    const agencies = await prisma.agency.findMany({
        select: { id: true, name: true, createdAt: true, updatedAt: true },
        orderBy: { name: 'asc' }
    });
    return agencies;
}

/**
 * Fetches account records filtered by type (INCOME / EXPENSE).
 */
export async function getAccountRecords(type: 'INCOME' | 'EXPENSE') {
    const records = await prisma.accountRecord.findMany({
        where: { type },
        include: {
            agency: { select: { name: true } },
            createdBy: { select: { name: true } },
            supplier: { select: { name: true } },
            customer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' }
    });
    return records.map(r => ({
        ...r,
        amount: Number(r.amount),
    }));
}

/**
 * Builds a treasury ledger from JournalEntry records.
 * Returns an array of transactions with running balance, sorted newest-first.
 */
export async function getTreasuryTransactions(agencyId?: string) {
    const whereClause: any = {};
    if (agencyId && agencyId !== 'ALL') {
        if (agencyId === 'GENERAL') {
            whereClause.agencyId = null;
        } else {
            whereClause.agencyId = agencyId;
        }
    }

    const entries = await prisma.journalEntry.findMany({
        where: whereClause,
        include: {
            agency: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' }
    });

    // Build ledger with running balance
    let balance = 0;
    const ledger = entries.map(entry => {
        const amount = entry.type === 'DEBIT' ? Number(entry.amount) : -Number(entry.amount);
        balance += amount;
        return {
            id: entry.id,
            type: entry.referenceType || (entry.type === 'DEBIT' ? 'INCOME' : 'EXPENSE'),
            description: entry.description,
            amount,
            balance,
            date: entry.createdAt,
            agencyName: entry.agency?.name || null,
        };
    });

    // Return newest first
    return ledger.reverse();
}

/**
 * Sets or updates an initial/opening treasury balance for an agency (or general).
 */
export async function setInitialTreasuryBalance(agencyId: string | null, amount: number) {
    const user = await getCurrentUser();
    const resolvedAgencyId = agencyId && agencyId !== 'GENERAL' && agencyId !== 'ALL' ? agencyId : null;

    // Check if an INITIAL entry already exists for this agency
    const existing = await prisma.journalEntry.findFirst({
        where: {
            referenceType: 'INITIAL',
            agencyId: resolvedAgencyId,
        }
    });

    if (existing) {
        // Update existing opening balance
        await prisma.journalEntry.update({
            where: { id: existing.id },
            data: { amount }
        });
    } else {
        // Create new opening balance entry
        await prisma.journalEntry.create({
            data: {
                amount,
                type: 'DEBIT',
                description: 'رصيد بداية المدة',
                referenceType: 'INITIAL',
                agencyId: resolvedAgencyId,
                userId: user.id,
                status: 'CONFIRMED'
            }
        });
    }

    revalidatePath('/dashboard/accounts', 'layout');
    return { success: true };
}

/**
 * Calculates a financial summary for the accounts dashboard.
 */
export async function getFinancialSummary(startDate: Date, endDate: Date, agencyId?: string) {
    const whereBase: any = {
        createdAt: { gte: startDate, lte: endDate }
    };
    if (agencyId) whereBase.agencyId = agencyId;

    // Total sales
    const salesAgg = await prisma.transaction.aggregate({
        where: { ...whereBase, type: 'SALE' },
        _sum: { totalAmount: true, paidAmount: true }
    });
    const totalSales = Number(salesAgg._sum.totalAmount || 0);

    // Total purchases
    const purchasesAgg = await prisma.transaction.aggregate({
        where: { ...whereBase, type: 'PURCHASE' },
        _sum: { totalAmount: true }
    });
    const totalPurchases = Number(purchasesAgg._sum.totalAmount || 0);

    // Expenses from account records
    const expenseAgg = await prisma.accountRecord.aggregate({
        where: { ...whereBase, type: 'EXPENSE' },
        _sum: { amount: true }
    });
    const expenses = Number(expenseAgg._sum.amount || 0);

    // Income from account records
    const incomeAgg = await prisma.accountRecord.aggregate({
        where: { ...whereBase, type: 'INCOME' },
        _sum: { amount: true }
    });
    const otherIncome = Number(incomeAgg._sum.amount || 0);

    // Gross profit
    const grossProfit = totalSales - totalPurchases;

    // Treasury balance from journal entries (all time, not just this period)
    const journalWhere: any = {};
    if (agencyId) journalWhere.agencyId = agencyId;

    const debitAgg = await prisma.journalEntry.aggregate({
        where: { ...journalWhere, type: 'DEBIT' },
        _sum: { amount: true }
    });
    const creditAgg = await prisma.journalEntry.aggregate({
        where: { ...journalWhere, type: 'CREDIT' },
        _sum: { amount: true }
    });
    const treasuryBalance = Number(debitAgg._sum.amount || 0) - Number(creditAgg._sum.amount || 0);

    // Check if there's an initial balance entry
    const hasInitialBalance = await prisma.journalEntry.findFirst({
        where: { ...journalWhere, referenceType: 'INITIAL' },
        select: { id: true }
    });

    return {
        totalSales,
        totalPurchases,
        expenses,
        otherIncome,
        grossProfit,
        treasuryBalance,
        hasInitialBalance: !!hasInitialBalance,
    };
}

/**
 * Fetches supplier balances for a specific agency.
 */
export async function getAgencySuppliersBalances(agencyId: string) {
    const suppliers = await prisma.supplier.findMany({
        where: { agencyId },
        select: {
            id: true,
            name: true,
            phone: true,
        }
    });

    const balances = await Promise.all(suppliers.map(async (supplier) => {
        // Total purchased from this supplier
        const purchaseAgg = await prisma.transaction.aggregate({
            where: { supplierId: supplier.id, type: 'PURCHASE' },
            _sum: { totalAmount: true, paidAmount: true }
        });

        // Payments made via account records
        const paymentAgg = await prisma.accountRecord.aggregate({
            where: { supplierId: supplier.id, type: 'EXPENSE' },
            _sum: { amount: true }
        });

        const totalPurchased = Number(purchaseAgg._sum.totalAmount || 0);
        const paidInPurchases = Number(purchaseAgg._sum.paidAmount || 0);
        const additionalPayments = Number(paymentAgg._sum.amount || 0);

        const currentBalance = totalPurchased - paidInPurchases - additionalPayments;

        return {
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone,
            currentBalance,
        };
    }));

    return balances;
}
