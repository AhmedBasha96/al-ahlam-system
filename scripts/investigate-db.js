const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Warehouses ---');
    const warehouses = await prisma.warehouse.findMany();
    console.log(JSON.stringify(warehouses, null, 2));

    console.log('\n--- Rep Users ---');
    const reps = await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' }
    });
    console.log(JSON.stringify(reps.map(r => ({ id: r.id, username: r.username, name: r.name })), null, 2));

    console.log('\n--- Stock Records ---');
    const stocks = await prisma.stock.findMany({
        include: { product: true }
    });
    console.log(JSON.stringify(stocks.map(s => ({
        warehouseId: s.warehouseId,
        productName: s.product.name,
        quantity: s.quantity
    })), null, 2));

    console.log('\n--- Transactions ---');
    const transactions = await prisma.transaction.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(transactions.map(t => ({
        type: t.type,
        userId: t.userId,
        warehouseId: t.warehouseId,
        note: t.note,
        itemCount: t.items.length,
        createdAt: t.createdAt
    })), null, 2));

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
