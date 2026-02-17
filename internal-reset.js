
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting internal data reset...');
    try {
        await prisma.$transaction([
            prisma.transactionItem.deleteMany(),
            prisma.transaction.deleteMany(),
            prisma.stock.deleteMany(),
            prisma.product.deleteMany(),
            prisma.customer.deleteMany(),
            prisma.accountRecord.deleteMany(),
            prisma.bankTransaction.deleteMany(),
            prisma.installment.deleteMany(),
            prisma.loan.deleteMany(),
            prisma.warehouse.deleteMany(),
            prisma.user.updateMany({
                where: { username: { not: 'ahmed' } },
                data: { agencyId: null, warehouseId: null }
            }),
            prisma.user.deleteMany({
                where: { username: { not: 'ahmed' } }
            })
        ]);
        console.log('✅ Data reset complete. Only admin "ahmed" remains.');
    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
