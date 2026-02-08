
const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Decimal Serialization ---');
    try {
        const d = new Decimal(10.5);
        console.log('Decimal(10.5):', d);
        console.log('Number(d):', Number(d));
        console.log('d.toNumber():', d.toNumber());
        console.log('JSON.stringify(d) should fail?', JSON.stringify(d)); // Usually fails or returns string
    } catch (e) {
        console.log('JSON.stringify(d) failed:', e.message);
    }

    console.log('\n--- Testing Product Fetching ---');
    try {
        const products = await prisma.product.findMany({ take: 1 });
        if (products.length > 0) {
            const p = products[0];
            console.log('Product found:', p.name);
            console.log('Factory Price Type:', typeof p.factoryPrice);
            console.log('Factory Price Value:', p.factoryPrice);
            console.log('Number(p.factoryPrice):', Number(p.factoryPrice));
        } else {
            console.log('No products found.');
        }

        const transactions = await prisma.transaction.findMany({ take: 1 });
        if (transactions.length > 0) {
            console.log('Transaction found:', transactions[0].id);
        } else {
            console.log('No transactions found.');
        }

    } catch (error) {
        console.error('DB Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
