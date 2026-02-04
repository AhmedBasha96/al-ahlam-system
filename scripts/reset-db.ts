import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting database reset...')

    try {
        // Delete in reverse dependency order

        console.log('Deleting Transaction Items...')
        await prisma.transactionItem.deleteMany()

        console.log('Deleting Stock...')
        await prisma.stock.deleteMany()

        console.log('Deleting Transactions...')
        await prisma.transaction.deleteMany()

        console.log('Deleting Bank Transactions...')
        await prisma.bankTransaction.deleteMany()

        console.log('Deleting Installments...')
        await prisma.installment.deleteMany()

        console.log('Deleting Loans...')
        await prisma.loan.deleteMany()

        console.log('Deleting Banks...')
        await prisma.bank.deleteMany()

        console.log('Deleting Account Records...')
        await prisma.accountRecord.deleteMany()

        console.log('Deleting Products...')
        await prisma.product.deleteMany()

        console.log('Deleting Customers...')
        await prisma.customer.deleteMany()

        console.log('Deleting Users (and Representatives)...')
        await prisma.user.deleteMany()

        console.log('Deleting Warehouses...')
        await prisma.warehouse.deleteMany()

        console.log('Deleting Agencies...')
        await prisma.agency.deleteMany()

        console.log('✅ All data cleared successfully.')

    } catch (error) {
        console.error('❌ Reset failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
