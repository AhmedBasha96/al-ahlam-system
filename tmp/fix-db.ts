
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Transaction table...');
    try {
        const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM Transaction;`);
        console.log('Current columns:', columns);

        const hasInvoiceNumber = (columns as any[]).some(col => col.Field === 'invoiceNumber');

        if (!hasInvoiceNumber) {
            console.log('Adding invoiceNumber column...');
            // Note: Adding an AUTO_INCREMENT column usually requires it to be indexed.
            // UNIQUE creates an index.
            await prisma.$executeRawUnsafe(`
        ALTER TABLE Transaction 
        ADD COLUMN invoiceNumber INT NOT NULL AUTO_INCREMENT UNIQUE FIRST;
      `);
            console.log('invoiceNumber column added successfully.');
        } else {
            console.log('invoiceNumber column already exists.');
        }
    } catch (error) {
        console.error('Error during DB fix:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
