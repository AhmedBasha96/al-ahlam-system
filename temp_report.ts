import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- START ---');
    try {
        const totalAgencies = await prisma.agency.count();
        const totalWarehouses = await prisma.warehouse.count();
        const totalCustomers = await prisma.customer.count();
        const totalSuppliers = await prisma.supplier.count();

        // Financial Totals
        const sales = await (prisma as any).transaction.aggregate({
            where: { type: 'SALE' },
            _sum: { totalAmount: true }
        });

        const purchases = await (prisma as any).transaction.aggregate({
            where: { type: 'PURCHASE' },
            _sum: { totalAmount: true }
        });

        const expenses = await prisma.accountRecord.aggregate({
            where: { type: 'EXPENSE' },
            _sum: { amount: true }
        });

        const income = await prisma.accountRecord.aggregate({
            where: { type: 'INCOME' },
            _sum: { amount: true }
        });

        const banks = await prisma.bank.findMany();
        const totalBankBalance = banks.reduce((sum, b) => sum + Number(b.balance), 0);

        const loans = await prisma.loan.findMany({ where: { status: 'ACTIVE' } });
        const totalLoansPrincipal = loans.reduce((sum, l) => sum + Number(l.principal), 0);

        // Sales breakdown by product (Top 5)
        const topProducts = await (prisma as any).transactionItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const topProductDetails = await Promise.all(topProducts.map(async (tp: any) => {
            const product = await (prisma as any).product.findUnique({ where: { id: tp.productId } });
            return { name: product?.name, quantity: tp._sum.quantity };
        }));

        const report = {
            summary: {
                totalAgencies,
                totalWarehouses,
                totalCustomers,
                totalSuppliers,
            },
            financials: {
                totalSales: Number(sales._sum.totalAmount || 0),
                totalPurchases: Number(purchases._sum.totalAmount || 0),
                totalExpenses: Number(expenses._sum.amount || 0),
                totalIncome: Number(income._sum.amount || 0),
                totalBankBalance,
                totalLoansPrincipal,
            },
            topProducts: topProductDetails
        };

        console.log(JSON.stringify(report, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
    console.log('--- END ---');
}

main();
