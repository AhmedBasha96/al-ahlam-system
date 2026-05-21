
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function audit() {
    console.log("--- Treasury Audit ---");

    // 1. Get all time Treasury Balance from our logic
    const { getTreasuryTransactions } = await import('../src/lib/actions/accounts');
    const txs = await getTreasuryTransactions();
    const currentLogicBalance = txs.length > 0 ? txs[0].balance : 0;
    console.log(`Current Logic Treasury Balance: ${currentLogicBalance}`);

    // 2. Sum up all collections that might have been missed
    const collections = await (prisma as any).transaction.aggregate({
        where: { type: 'COLLECTION' },
        _sum: { paidAmount: true }
    });
    console.log(`Total Collections (Type: COLLECTION): ${Number(collections._sum.paidAmount || 0)}`);

    // 3. Sum up all income/expenses
    const income = await prisma.accountRecord.aggregate({
        where: { type: 'INCOME' },
        _sum: { amount: true }
    });
    const expenses = await prisma.accountRecord.aggregate({
        where: { type: 'EXPENSE' },
        _sum: { amount: true }
    });
    console.log(`Total Income: ${Number(income._sum.amount || 0)}`);
    console.log(`Total Expenses: ${Number(expenses._sum.amount || 0)}`);

    // 4. Sum up Sales/Purchases (Paid part)
    const salesPaid = await prisma.transaction.aggregate({
        where: { type: 'SALE' },
        _sum: { paidAmount: true }
    });
    const purchasesPaid = await prisma.transaction.aggregate({
        where: { type: 'PURCHASE' },
        _sum: { paidAmount: true }
    });
    console.log(`Total Sales Paid: ${Number(salesPaid._sum.paidAmount || 0)}`);
    console.log(`Total Purchases Paid: ${Number(purchasesPaid._sum.paidAmount || 0)}`);

    const manualSum = Number(salesPaid._sum.paidAmount || 0)
        - Number(purchasesPaid._sum.paidAmount || 0)
        + Number(collections._sum.paidAmount || 0)
        + Number(income._sum.amount || 0)
        - Number(expenses._sum.amount || 0);

    console.log(`Manual Global Sum (including collections): ${manualSum}`);
    console.log(`Gap: ${manualSum - currentLogicBalance}`);

    if (manualSum !== currentLogicBalance) {
        console.warn("DIFFERENCE DETECTED! My logic fix should have addressed this.");
    } else {
        console.log("Treasury logic is now consistent with global sums.");
    }

    await prisma.$disconnect();
}

audit().catch(console.error);
