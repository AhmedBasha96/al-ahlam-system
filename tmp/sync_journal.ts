
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function sync() {
    console.log("--- Journal Synchronization ---");

    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found to attribute journal entries.");
        return;
    }

    // 1. Fetch all transactions that don't have a journal entry yet
    // Since JournalEntry is new, we'll sync ALL existing relevant records.

    // SALES
    const sales = await prisma.transaction.findMany({
        where: { type: 'SALE', paidAmount: { gt: 0 } }
    });
    console.log(`Syncing ${sales.length} sales...`);
    for (const sale of sales) {
        await (prisma as any).journalEntry.create({
            data: {
                amount: sale.paidAmount,
                type: 'DEBIT',
                description: `مبيعات فاتورة رقم ${sale.id}`,
                referenceId: sale.id,
                referenceType: 'SALE',
                agencyId: sale.agencyId,
                userId: sale.userId || user.id,
                createdAt: sale.createdAt
            }
        });
    }

    // COLLECTIONS
    const collections = await prisma.transaction.findMany({
        where: { type: 'COLLECTION', paidAmount: { gt: 0 } }
    });
    console.log(`Syncing ${collections.length} collections...`);
    for (const col of collections) {
        await (prisma as any).journalEntry.create({
            data: {
                amount: col.paidAmount,
                type: 'DEBIT',
                description: `تحصيل مديونية - ${col.note || ''}`,
                referenceId: col.id,
                referenceType: 'COLLECTION',
                agencyId: col.agencyId,
                userId: col.userId || user.id,
                createdAt: col.createdAt
            }
        });
    }

    // PURCHASES / SUPPLY PAYMENTS
    const payments = await prisma.transaction.findMany({
        where: { type: { in: ['PURCHASE', 'SUPPLY_PAYMENT'] }, paidAmount: { gt: 0 } }
    });
    console.log(`Syncing ${payments.length} payments/purchases...`);
    for (const p of payments) {
        await (prisma as any).journalEntry.create({
            data: {
                amount: p.paidAmount,
                type: 'CREDIT',
                description: p.type === 'PURCHASE' ? `شراء بضاعة - ${p.id}` : `سداد مورد - ${p.id}`,
                referenceId: p.id,
                referenceType: p.type,
                agencyId: p.agencyId,
                userId: p.userId || user.id,
                createdAt: p.createdAt
            }
        });
    }

    // INCOME / EXPENSES
    const records = await prisma.accountRecord.findMany();
    console.log(`Syncing ${records.length} account records...`);
    for (const rec of records) {
        await (prisma as any).journalEntry.create({
            data: {
                amount: rec.amount,
                type: rec.type === 'INCOME' ? 'DEBIT' : 'CREDIT',
                description: rec.description,
                referenceId: rec.id,
                referenceType: rec.type,
                agencyId: rec.agencyId,
                userId: rec.userId || user.id,
                createdAt: rec.createdAt
            }
        });
    }

    console.log("Sync completed successfully.");
    await prisma.$disconnect();
}

sync().catch(console.error);
