
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const txs = await prisma.transaction.findMany({
        where: { type: 'SALE' },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    for (const tx of txs) {
        console.log(`TX ID: ${tx.id}, Total: ${tx.totalAmount}, Paid: ${tx.paidAmount}`);
        for (const item of tx.items) {
            console.log(`  Item: ${item.product.name}, Qty: ${item.quantity}, Price: ${item.price}, Cost: ${item.cost}, Product Factory Price: ${item.product.unitFactoryPrice}`);
        }
    }
}

check();
