
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Transaction table...');
    try {
        const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM Transaction;`);
        console.log('Current columns:', columns.map(c => c.Field));

        const hasInvoiceNumber = columns.some(col => col.Field === 'invoiceNumber');

        if (!hasInvoiceNumber) {
            console.log('Adding invoiceNumber column...');
            // Adding it as FIRST to match the schema.prisma if possible, but safely.
            // We also need to handle existing rows by giving them IDs.
            await prisma.$executeRawUnsafe(`
        ALTER TABLE Transaction 
        ADD COLUMN invoiceNumber INT NOT NULL AUTO_INCREMENT UNIQUE;
      `);
            console.log('invoiceNumber column added successfully.');
        } else {
            console.log('invoiceNumber column already exists.');
        }
    } catch (error) {
        console.error('Error during DB fix:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
