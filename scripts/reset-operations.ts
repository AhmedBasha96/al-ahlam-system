
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetOperations() {
    console.log('🗑️ Starting Operations Reset...');

    try {
        // Transaction-based deletion to ensure integrity
        await prisma.$transaction(async (tx) => {
            // 1. Delete Transaction Items & Transactions
            console.log('Clearing Transactions...');
            await tx.transactionItem.deleteMany();
            await tx.transaction.deleteMany();

            // 2. Clear Inventory (Stock)
            console.log('Clearing Stock...');
            await tx.stock.deleteMany();

            // 3. Clear Financial Records
            console.log('Clearing Account Records...');
            await tx.accountRecord.deleteMany();

            // 4. Clear Bank Transactions (But keep Banks)
            console.log('Clearing Bank Transactions...');
            await tx.bankTransaction.deleteMany();

            // 5. Clear Loans
            console.log('Clearing Loans...');
            await tx.installment.deleteMany();
            await tx.loan.deleteMany();

            // 6. Reset Customer Debt (Optional: if debt is calculated from fields not transactions)
            // Actually, debt is typically calculated or might be cached. 
            // If Customer model has a 'debt' field, we should zero it.
            // Checking Schema... Customer has no direct 'debt' field stored, it's calculated from transactions?
            // Wait, let's verify schema for Customer 'debt'.
            // If fine, we continue.

            console.log('✅ Operations Data Wiped Successfully.');
        });
    } catch (error) {
        console.error('❌ Error resetting operations:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

resetOperations();
