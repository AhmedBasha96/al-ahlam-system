
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkProfit() {
    console.log('--- Profit Diagnostics ---');

    const lastSales = await prisma.transaction.findMany({
        where: { type: 'SALE' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: { include: { product: true } } }
    });

    if (lastSales.length === 0) {
        console.log('No SALE transactions found.');
    }

    for (const tx of lastSales) {
        let txCost = 0;
        console.log(`\nTransaction ID: ${tx.id}`);
        console.log(`Date: ${tx.createdAt}`);
        console.log(`Total Amount: ${tx.totalAmount}`);
        console.log(`Note: ${tx.note}`);
        console.log(`Items:`);

        for (const item of tx.items) {
            const lineCost = Number(item.quantity) * Number(item.cost || 0);
            txCost += lineCost;
            console.log(` - Product: ${item.product?.name}, Qty: ${item.quantity}, Price: ${item.price}, Cost(unit): ${item.cost}, Line Cost: ${lineCost}`);
        }

        console.log(`Transaction Calculated Profit: ${Number(tx.totalAmount) - txCost}`);
    }

    const allExpenses = await prisma.accountRecord.findMany({
        where: { type: 'EXPENSE' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('\n--- Recent Expenses ---');
    for (const exp of allExpenses) {
        console.log(`${exp.createdAt}: [${exp.category}] ${exp.amount} - ${exp.description}`);
    }

    await prisma.$disconnect();
}

checkProfit().catch(err => {
    console.error(err);
    process.exit(1);
});
