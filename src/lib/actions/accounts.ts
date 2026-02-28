'use server';

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { JournalEntryType, AccountRecordType } from "@prisma/client";
import { getCurrentUser } from "../actions";

// --- Helper for Professional Accounting ---

export async function recordJournalEntry(
    tx: any,
    data: {
        amount: number,
        type: JournalEntryType,
        description: string,
        referenceId?: string,
        referenceType?: string,
        agencyId?: string | null,
        userId: string
    }
) {
    return await tx.journalEntry.create({
        data: {
            amount: data.amount,
            type: data.type,
            description: data.description,
            referenceId: data.referenceId,
            referenceType: data.referenceType,
            agencyId: data.agencyId,
            userId: data.userId
        }
    });
}

// Helper to get agencies for selection
export async function getAgencies() {
    return await prisma.agency.findMany({ select: { id: true, name: true } });
}

// --- Account Records (Expenses/Income) ---

export async function createAccountRecord(formData: FormData) {
    const amount = Number(formData.get('amount'));
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const type = formData.get('type') as AccountRecordType;
    const date = formData.get('date') as string;
    const agencyIdRaw = formData.get('agencyId') as string;
    const supplierId = formData.get('supplierId') as string;
    const customerId = formData.get('customerId') as string;
    const imageFile = formData.get('image') as File | null;

    // If agencyId is "GENERAL" or empty, store as null (General Expense)
    const agencyId = (agencyIdRaw && agencyIdRaw !== 'GENERAL') ? agencyIdRaw : null;

    if (!amount || !description || !type) throw new Error('Amount, Description, and Type are required');

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

    await prisma.$transaction(async (tx) => {
        const record = await tx.accountRecord.create({
            data: {
                amount,
                description,
                category: category || null,
                type,
                agencyId: agencyId,
                userId: user.id,
                supplierId: supplierId || null,
                customerId: customerId || null,
                createdAt: date ? new Date(date) : new Date(),
                imageUrl: imageUrl,
            }
        });

        await recordJournalEntry(tx, {
            amount,
            type: type === 'INCOME' ? 'DEBIT' : 'CREDIT',
            description: `${description} (${category || 'عام'})`,
            referenceId: record.id,
            referenceType: type,
            agencyId: agencyId,
            userId: user.id
        });
    }, { timeout: 15000 });

    revalidatePath('/dashboard/accounts', 'layout');
}

export async function getAccountRecords(type?: AccountRecordType, agencyIdFilter?: string | null) {
    // agencyIdFilter: 'GENERAL' for general, specific ID for agency, undefined for ALL

    let whereClause: any = { type };

    if (agencyIdFilter === 'GENERAL') {
        whereClause.agencyId = null;
    } else if (agencyIdFilter) {
        whereClause.agencyId = agencyIdFilter;
    }
    // If agencyIdFilter is undefined/null, we fetch ALL (optional, depending on requirement)
    // But usually for lists we might want to see everything or filter.
    // Let's default to fetching EVERYTHING if no filter provided.

    return await prisma.accountRecord.findMany({
        where: whereClause,
        include: { agency: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });
}

export async function deleteAccountRecord(id: string) {
    await prisma.accountRecord.delete({ where: { id } });
    revalidatePath('/dashboard/accounts', 'layout');
}

// --- Purchase Invoices ---
// Purchases are ALWAYS tied to a warehouse, thus tied to an Agency.
export async function createPurchaseInvoice(formData: FormData) {
    const warehouseId = formData.get('warehouseId') as string;
    const itemsJson = formData.get('items') as string;
    const paidAmount = Number(formData.get('paidAmount') || 0);
    const note = formData.get('note') as string;
    const date = formData.get('date') as string;
    const supplierId = formData.get('supplierId') as string;
    const imageFile = formData.get('image') as File | null;

    const items: { productId: string, quantity: number, cost: number }[] = JSON.parse(itemsJson);

    if (!warehouseId || items.length === 0) throw new Error('Invalid Purchase Data');

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new Error('Warehouse not found');

    const user = await getCurrentUser();

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

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

    await prisma.$transaction(async (tx) => {
        // 1. Update Stock
        for (const item of items) {
            await tx.stock.upsert({
                where: { warehouseId_productId: { warehouseId, productId: item.productId } },
                update: { quantity: { increment: item.quantity } },
                create: { warehouseId, productId: item.productId, quantity: item.quantity }
            });
        }

        // 2. Create Transaction
        const transaction = await (tx as any).transaction.create({
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
                createdAt: date ? new Date(date) : new Date(),
                imageUrl: imageUrl,
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.cost,
                        cost: item.cost
                    }))
                }
            }
        });

        // 3. Record Journal Entry (If cash paid)
        if (paidAmount > 0) {
            await recordJournalEntry(tx, {
                amount: paidAmount,
                type: 'CREDIT',
                description: `سداد نقدي فاتورة مشتريات رقم ${transaction.id}`,
                referenceId: transaction.id,
                referenceType: 'PURCHASE',
                agencyId: warehouse.agencyId,
                userId: user.id
            });
        }
    }, { timeout: 15000 });

    revalidatePath('/dashboard/accounts', 'layout');
}

export async function getPurchaseInvoices(agencyIdFilter?: string) {
    const whereClause: any = { type: 'PURCHASE' };
    if (agencyIdFilter) {
        whereClause.agencyId = agencyIdFilter;
    }

    return await prisma.transaction.findMany({
        where: whereClause,
        include: { items: { include: { product: true } }, warehouse: true, agency: true },
        orderBy: { createdAt: 'desc' }
    });
}

// --- Dashboard & Treasury ---

export async function getTreasuryTransactions(agencyIdFilter?: string | 'GENERAL') {
    // 1. Build Where Clause
    const where: any = {};
    if (agencyIdFilter === 'GENERAL') {
        where.agencyId = null;
    } else if (agencyIdFilter) {
        where.agencyId = agencyIdFilter;
    }

    // 2. Fetch from JournalEntry (The Centralized Ledger)
    const journalEntries = await prisma.journalEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { agency: { select: { name: true } } }
    });

    // 2. Map to UI Format (Ascending for balance calculation)
    const sortedEntries = [...journalEntries].reverse();

    let currentBalance = 0;
    const transactions = sortedEntries.map(entry => {
        const amount = Number(entry.amount);
        const signedAmount = entry.type === 'DEBIT' ? amount : -amount;
        currentBalance += signedAmount;

        return {
            id: entry.id,
            date: entry.createdAt,
            amount: signedAmount,
            type: entry.referenceType || 'ENTRY',
            description: entry.description,
            agencyName: entry.agency?.name || 'عام',
            balance: currentBalance
        };
    });

    // 4. Return for UI (Descending)
    return transactions.reverse();
}

export async function getFinancialSummary(startDate: Date, endDate: Date, agencyIdFilter?: string) {
    // If agencyIdFilter is not provided, we sum EVERYTHING.
    // If 'GENERAL', we sum only NULL agency records (mostly expenses/income).

    // ... (Simplified for brevity, similar logic to getTreasuryTransactions)
    // For now, let's keep the dashboard simple and maybe aggregated.
    // Or return 0s if filtered specific.

    // Let's implement dynamic query building
    const txWhere: any = { createdAt: { gte: startDate, lte: endDate } };
    const accWhere: any = { createdAt: { gte: startDate, lte: endDate } };

    if (agencyIdFilter === 'GENERAL') {
        txWhere.agencyId = 'NONE';
        accWhere.agencyId = null;
    } else if (agencyIdFilter) {
        txWhere.agencyId = agencyIdFilter;
        accWhere.agencyId = agencyIdFilter;
    }

    const salesTx = await prisma.transaction.findMany({ where: { ...txWhere, type: 'SALE' }, include: { items: true } });
    const purchasesTx = await prisma.transaction.findMany({ where: { ...txWhere, type: 'PURCHASE' }, include: { items: true } });

    const expensesAgg = await prisma.accountRecord.aggregate({
        where: { ...accWhere, type: 'EXPENSE', category: { not: 'رصيد بداية المدة' } },
        _sum: { amount: true }
    });
    const incomeAgg = await prisma.accountRecord.aggregate({
        where: { ...accWhere, type: 'INCOME', category: { not: 'رصيد بداية المدة' } },
        _sum: { amount: true }
    });

    // Calculate Sales & Cost
    let totalSales = 0;
    let totalCost = 0;
    for (const tx of salesTx) {
        totalSales += Number(tx.totalAmount);
        for (const item of tx.items) totalCost += (item.quantity * Number(item.cost));
    }

    const expenses = Number(expensesAgg._sum.amount || 0);
    const income = Number(incomeAgg._sum.amount || 0);
    const grossProfit = totalSales - totalCost;
    const netProfit = grossProfit + income - expenses;

    // Treasury Balance (All Time)
    // We need to re-fetch all time transactions for balance
    const allTx = await getTreasuryTransactions(agencyIdFilter as any);
    const treasuryBalance = allTx.length > 0 ? (allTx[0].balance || 0) : 0;

    // Check if initial balance exists for Treasury
    const hasInitialBalance = await prisma.accountRecord.findFirst({
        where: {
            category: 'رصيد بداية المدة',
            agencyId: agencyIdFilter === 'GENERAL' ? null : (agencyIdFilter || undefined),
            customerId: null,
            supplierId: null
        }
    }).then(res => !!res);

    return {
        totalSales,
        totalCost,
        grossProfit,
        expenses,
        income,
        netProfit,
        treasuryBalance,
        hasInitialBalance
    };
}

export async function updateAccountRecord(id: string, updates: { amount?: number; description?: string; category?: string }) {
    try {
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
    } catch (error) {
        console.error("updateAccountRecord error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getAgencySuppliersBalances(agencyId: string) {
    const suppliers = await (prisma as any).supplier.findMany({
        where: { agencyId },
        include: {
            transactions: {
                select: { totalAmount: true, paidAmount: true }
            },
            accounts: {
                select: { amount: true, type: true }
            }
        }
    });

    return suppliers.map((supplier: any) => {
        const transactionsBalance = supplier.transactions.reduce((acc: number, t: any) =>
            acc + (Number(t.totalAmount) - Number(t.paidAmount || 0)), 0);

        const accountsBalance = supplier.accounts.reduce((acc: number, accRec: any) =>
            acc + (accRec.type === 'EXPENSE' ? -Number(accRec.amount) : Number(accRec.amount)), 0);

        return {
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone,
            currentBalance: transactionsBalance + accountsBalance
        };
    });
}
