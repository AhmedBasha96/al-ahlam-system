'use server';

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../actions";
import { AccountRecordType } from "@prisma/client";

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

    await prisma.accountRecord.create({
        data: {
            amount,
            description,
            category: category || null,
            type,
            agencyId: agencyId, // Can be null now
            userId: user.id,
            supplierId: supplierId || null,
            createdAt: date ? new Date(date) : new Date(),
            imageUrl: imageUrl,
        }
    });

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

            // Optionally update product factory price
            await tx.product.update({
                where: { id: item.productId },
                data: { factoryPrice: item.cost }
            });
        }

        // 2. Create Transaction
        await tx.transaction.create({
            data: {
                type: 'PURCHASE',
                totalAmount,
                paidAmount,
                remainingAmount: totalAmount - paidAmount,
                userId: user.id,
                agencyId: warehouse.agencyId, // Auto-assign based on warehouse
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
    });

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
    // 1. Build Where Clauses
    const salesWhere: any = { type: 'SALE', paidAmount: { gt: 0 } };
    const purchasesWhere: any = { type: 'PURCHASE', paidAmount: { gt: 0 } };
    const incomeWhere: any = { type: 'INCOME' };
    const expensesWhere: any = { type: 'EXPENSE' };

    if (agencyIdFilter === 'GENERAL') {
        // Sales/Purchases are always Agency-bound, so General Treasury only has Income/Expenses
        // actually maybe "General" means "No Agency".
        salesWhere.agencyId = 'NONE'; // Impossible, just to return empty
        purchasesWhere.agencyId = 'NONE';
        incomeWhere.agencyId = null;
        expensesWhere.agencyId = null;
    } else if (agencyIdFilter) {
        salesWhere.agencyId = agencyIdFilter;
        purchasesWhere.agencyId = agencyIdFilter;
        incomeWhere.agencyId = agencyIdFilter;
        expensesWhere.agencyId = agencyIdFilter;
    }

    // 2. Fetch Data
    const sales = await prisma.transaction.findMany({
        where: salesWhere,
        select: { id: true, createdAt: true, paidAmount: true, note: true, agency: { select: { name: true } } }
    });

    const purchases = await prisma.transaction.findMany({
        where: purchasesWhere,
        select: { id: true, createdAt: true, paidAmount: true, note: true, warehouse: { select: { name: true } }, agency: { select: { name: true } } }
    });

    const income = await prisma.accountRecord.findMany({
        where: incomeWhere,
        select: { id: true, createdAt: true, amount: true, description: true, category: true, agency: { select: { name: true } } }
    });

    const expenses = await prisma.accountRecord.findMany({
        where: expensesWhere,
        select: { id: true, createdAt: true, amount: true, description: true, category: true, agency: { select: { name: true } } }
    });

    // 3. Merge
    const transactions = [
        ...sales.map(t => ({
            id: t.id,
            date: t.createdAt,
            amount: Number(t.paidAmount),
            type: 'SALE',
            description: `مبيعات (${t.agency?.name || 'غير معروف'}) ` + (t.note || ''),
            agencyName: t.agency?.name || 'غير معروف'
        })),
        ...purchases.map(t => ({
            id: t.id,
            date: t.createdAt,
            amount: -Number(t.paidAmount),
            type: 'PURCHASE',
            description: `شراء (${t.agency?.name || 'غير معروف'}) ` + (t.note || ''),
            warehouseName: t.warehouse?.name || 'غير معروف',
            agencyName: t.agency?.name || 'غير معروف'
        })),
        ...income.map(t => ({
            id: t.id,
            date: t.createdAt,
            amount: Number(t.amount),
            type: 'INCOME',
            description: `${t.description} (${t.category || 'عام'})`,
            agencyName: t.agency?.name || 'عام'
        })),
        ...expenses.map(t => ({
            id: t.id,
            date: t.createdAt,
            amount: -Number(t.amount),
            type: 'EXPENSE',
            description: `${t.description} (${t.category || 'عام'})`,
            agencyName: t.agency?.name || 'عام'
        }))
    ];

    // 4. Sort
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 5. Calculate Balance
    let currentBalance = 0;
    const transactionsWithBalance = transactions.map(t => {
        currentBalance += t.amount;
        return { ...t, balance: currentBalance };
    });

    return transactionsWithBalance.reverse();
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

    const expensesAgg = await prisma.accountRecord.aggregate({ where: { ...accWhere, type: 'EXPENSE' }, _sum: { amount: true } });
    const incomeAgg = await prisma.accountRecord.aggregate({ where: { ...accWhere, type: 'INCOME' }, _sum: { amount: true } });

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

    return {
        totalSales,
        totalCost,
        grossProfit,
        expenses,
        income,
        netProfit,
        treasuryBalance
    };
}
