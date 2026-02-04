'use server';

import prisma from "@/lib/db";
import { AccountRecordType } from "@prisma/client";

// Helper function to get date range
function getDateRange(startDate?: Date, endDate?: Date) {
    return {
        gte: startDate || new Date(0),
        lte: endDate || new Date()
    };
}

// ============= تقرير الأرباح والخسائر =============
export async function getProfitLossReport(
    startDate?: Date,
    endDate?: Date,
    agencyId?: string
) {
    const dateRange = getDateRange(startDate, endDate);
    const agencyFilter = agencyId && agencyId !== 'ALL' ? { agencyId } : {};

    // 1. Get Sales Revenue
    const sales = await prisma.transaction.findMany({
        where: {
            type: 'SALE',
            createdAt: dateRange,
            NOT: {
                note: {
                    startsWith: 'تحميل للمندوب'
                }
            },
            ...agencyFilter
        },
        include: {
            items: {
                include: {
                    product: true
                }
            },
            agency: true
        }
    });

    // 2. Get Other Income
    const otherIncome = await prisma.accountRecord.findMany({
        where: {
            type: 'INCOME',
            createdAt: dateRange,
            ...agencyFilter
        },
        include: {
            agency: true
        }
    });

    // 3. Get Expenses
    const expenses = await prisma.accountRecord.findMany({
        where: {
            type: 'EXPENSE',
            createdAt: dateRange,
            ...agencyFilter
        },
        include: {
            agency: true
        }
    });

    // --- Calculation & Breakdown Logic ---

    // Initialize overall totals
    let totalRevenue = 0;
    let totalCost = 0;
    let salesProfit = 0;

    // Helper to initialize an agency bucket
    const createBucket = (id: string, name: string) => ({
        agencyId: id,
        agencyName: name,
        salesRevenue: 0,
        costOfGoodsSold: 0,
        salesProfit: 0,
        otherIncome: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        salesCount: 0,
        expensesCount: 0
    });

    const breakdownMap = new Map<string, ReturnType<typeof createBucket>>();

    // Helper to get or create bucket
    const getBucket = (agencyId: string, agencyName: string) => {
        if (!breakdownMap.has(agencyId)) {
            breakdownMap.set(agencyId, createBucket(agencyId, agencyName));
        }
        return breakdownMap.get(agencyId)!;
    };

    // Process Sales
    sales.forEach(sale => {
        let saleRevenue = 0;
        let saleCost = 0;

        sale.items.forEach(item => {
            const revenue = Number(item.price) * item.quantity;
            // Fallback: If item.cost is 0, use current factoryPrice from product
            const unitCost = Number(item.cost) > 0 ? Number(item.cost) : Number(item.product.factoryPrice);
            const cost = unitCost * item.quantity;

            saleRevenue += revenue;
            saleCost += cost;
        });

        totalRevenue += saleRevenue;
        totalCost += saleCost;

        // Add to agency breakdown
        if (sale.agencyId) {
            const bucket = getBucket(sale.agencyId, sale.agency?.name || 'Unknown Agency');
            bucket.salesRevenue += saleRevenue;
            bucket.costOfGoodsSold += saleCost;
            bucket.salesCount++;
        } else {
            const bucket = getBucket('GENERAL', 'عام (غير محدد)');
            bucket.salesRevenue += saleRevenue;
            bucket.costOfGoodsSold += saleCost;
            bucket.salesCount++;
        }
    });

    salesProfit = totalRevenue - totalCost;
    const otherIncomeTotal = otherIncome.reduce((sum, record) => sum + Number(record.amount), 0);
    const totalExpenses = expenses.reduce((sum, record) => sum + Number(record.amount), 0);

    // Process Other Income for Breakdown
    otherIncome.forEach(record => {
        const amount = Number(record.amount);
        if (record.agencyId) {
            const bucket = getBucket(record.agencyId, record.agency?.name || 'Unknown Agency');
            bucket.otherIncome += amount;
        } else {
            const bucket = getBucket('GENERAL', 'عام (غير محدد)');
            bucket.otherIncome += amount;
        }
    });

    // Process Expenses for Breakdown
    expenses.forEach(record => {
        const amount = Number(record.amount);
        if (record.agencyId) {
            const bucket = getBucket(record.agencyId, record.agency?.name || 'Unknown Agency');
            bucket.totalExpenses += amount;
            bucket.expensesCount++;
        } else {
            const bucket = getBucket('GENERAL', 'عام (غير محدد)');
            bucket.totalExpenses += amount;
            bucket.expensesCount++;
        }
    });

    // Finalize Breakdown Calculations
    const breakdown = Array.from(breakdownMap.values()).map(b => {
        b.salesProfit = b.salesRevenue - b.costOfGoodsSold;
        b.totalIncome = b.salesProfit + b.otherIncome;
        b.netProfit = b.totalIncome - b.totalExpenses;
        return b;
    });

    // 4. Calculate Net Profit/Loss (Overall)
    const totalIncome = salesProfit + otherIncomeTotal;
    const netProfit = totalIncome - totalExpenses;

    return {
        salesRevenue: totalRevenue,
        costOfGoodsSold: totalCost,
        salesProfit,
        otherIncome: otherIncomeTotal,
        totalIncome,
        totalExpenses,
        netProfit,
        salesCount: sales.length,
        expensesCount: expenses.length,
        breakdown // Include the breakdown in the response
    };
}

// ============= تقرير الإيرادات والمصروفات =============
export async function getIncomeExpensesReport(
    startDate?: Date,
    endDate?: Date,
    agencyId?: string
) {
    const dateRange = getDateRange(startDate, endDate);
    const agencyFilter = agencyId && agencyId !== 'ALL' ? { agencyId } : {};

    const income = await prisma.accountRecord.findMany({
        where: {
            type: 'INCOME',
            createdAt: dateRange,
            ...agencyFilter
        },
        include: {
            agency: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    const expenses = await prisma.accountRecord.findMany({
        where: {
            type: 'EXPENSE',
            createdAt: dateRange,
            ...agencyFilter
        },
        include: {
            agency: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Group by category
    const incomeByCategory = new Map<string, number>();
    const expensesByCategory = new Map<string, number>();

    income.forEach(record => {
        const cat = record.category || 'غير مصنف';
        incomeByCategory.set(cat, (incomeByCategory.get(cat) || 0) + Number(record.amount));
    });

    expenses.forEach(record => {
        const cat = record.category || 'غير مصنف';
        expensesByCategory.set(cat, (expensesByCategory.get(cat) || 0) + Number(record.amount));
    });

    const totalIncome = income.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.amount), 0);

    // Convert Decimal to number for serialization
    const serializedIncome = income.map(r => ({ ...r, amount: Number(r.amount) }));
    const serializedExpenses = expenses.map(r => ({ ...r, amount: Number(r.amount) }));

    return {
        income: serializedIncome,
        expenses: serializedExpenses,
        incomeByCategory: Array.from(incomeByCategory.entries()).map(([name, value]) => ({ name, value })),
        expensesByCategory: Array.from(expensesByCategory.entries()).map(([name, value]) => ({ name, value })),
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses
    };
}

// ============= تقرير حركة البنوك =============
export async function getBankMovementsReport(
    startDate?: Date,
    endDate?: Date,
    bankId?: string
) {
    const dateRange = getDateRange(startDate, endDate);
    const bankFilter = bankId && bankId !== 'ALL' ? { id: bankId } : {};

    const banks = await prisma.bank.findMany({
        where: bankFilter,
        include: {
            transactions: {
                where: {
                    date: dateRange
                },
                orderBy: { date: 'desc' }
            }
        }
    });

    const report = banks.map(bank => {
        const deposits = bank.transactions.filter(t => t.type === 'DEPOSIT');
        const withdrawals = bank.transactions.filter(t => t.type === 'WITHDRAWAL');

        const totalDeposits = deposits.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            bankId: bank.id,
            bankName: bank.name,
            currentBalance: Number(bank.balance),
            totalDeposits,
            totalWithdrawals,
            netMovement: totalDeposits - totalWithdrawals,
            transactionsCount: bank.transactions.length,
            transactions: bank.transactions.map(t => ({
                ...t,
                amount: Number(t.amount)
            }))
        };
    });

    return report;
}

// ============= تقرير حالة الخزائن =============
export async function getTreasuryStatusReport(
    startDate?: Date,
    endDate?: Date
) {
    const dateRange = getDateRange(startDate, endDate);

    // General Treasury
    const generalIncome = await prisma.accountRecord.findMany({
        where: {
            type: 'INCOME',
            agencyId: null,
            createdAt: dateRange
        }
    });

    const generalExpenses = await prisma.accountRecord.findMany({
        where: {
            type: 'EXPENSE',
            agencyId: null,
            createdAt: dateRange
        }
    });

    const generalTotalIncome = generalIncome.reduce((sum, r) => sum + Number(r.amount), 0);
    const generalTotalExpenses = generalExpenses.reduce((sum, r) => sum + Number(r.amount), 0);
    const generalBalance = generalTotalIncome - generalTotalExpenses;

    // Agency Treasuries
    const agencies = await prisma.agency.findMany({
        include: {
            accounts: {
                where: {
                    createdAt: dateRange
                }
            }
        }
    });

    const agencyTreasuries = agencies.map(agency => {
        const income = agency.accounts.filter(r => r.type === 'INCOME');
        const expenses = agency.accounts.filter(r => r.type === 'EXPENSE');

        const totalIncome = income.reduce((sum, r) => sum + Number(r.amount), 0);
        const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.amount), 0);

        return {
            agencyId: agency.id,
            agencyName: agency.name,
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses
        };
    });

    return {
        generalTreasury: {
            totalIncome: generalTotalIncome,
            totalExpenses: generalTotalExpenses,
            balance: generalBalance
        },
        agencyTreasuries,
        totalBalance: generalBalance + agencyTreasuries.reduce((sum, a) => sum + a.balance, 0)
    };
}

// ============= تقرير المشتريات =============
export async function getPurchasesReport(
    startDate?: Date,
    endDate?: Date,
    warehouseId?: string
) {
    const dateRange = getDateRange(startDate, endDate);
    const warehouseFilter = warehouseId && warehouseId !== 'ALL' ? { warehouseId } : {};

    const purchases = await prisma.transaction.findMany({
        where: {
            type: 'PURCHASE',
            createdAt: dateRange,
            ...warehouseFilter
        },
        include: {
            items: {
                include: {
                    product: true
                }
            },
            warehouse: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalPaid = purchases.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);
    const totalOutstanding = purchases.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0);

    // Group by warehouse
    const byWarehouse = new Map<string, { name: string, total: number, count: number }>();
    purchases.forEach(p => {
        if (p.warehouse) {
            const current = byWarehouse.get(p.warehouse.id) || { name: p.warehouse.name, total: 0, count: 0 };
            current.total += Number(p.totalAmount);
            current.count += 1;
            byWarehouse.set(p.warehouse.id, current);
        }
    });

    // Convert Decimal fields to numbers for serialization
    const serializedPurchases = purchases.map(p => ({
        ...p,
        totalAmount: Number(p.totalAmount),
        paidAmount: p.paidAmount ? Number(p.paidAmount) : 0,
        remainingAmount: p.remainingAmount ? Number(p.remainingAmount) : 0,
        items: p.items.map(item => ({
            ...item,
            price: Number(item.price),
            cost: Number(item.cost),
            product: {
                ...item.product,
                factoryPrice: Number(item.product.factoryPrice),
                wholesalePrice: Number(item.product.wholesalePrice),
                retailPrice: Number(item.product.retailPrice)
            }
        }))
    }));

    return {
        purchases: serializedPurchases,
        totalPurchases,
        totalPaid,
        totalOutstanding,
        purchasesCount: purchases.length,
        byWarehouse: Array.from(byWarehouse.values())
    };
}

// ============= تقرير القروض =============
export async function getLoansReport() {
    const loans = await prisma.loan.findMany({
        include: {
            bank: true,
            installments: {
                orderBy: { dueDate: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const activeLoans = loans.filter(l => l.status === 'ACTIVE');

    let totalPrincipal = 0;
    let totalRemaining = 0;
    let overdueCount = 0;
    let upcomingCount = 0;

    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    activeLoans.forEach(loan => {
        totalPrincipal += Number(loan.principal);

        const paidInstallments = loan.installments.filter(i => i.status === 'PAID');
        const paidAmount = paidInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
        totalRemaining += Number(loan.totalAmount) - paidAmount;

        loan.installments.forEach(inst => {
            if (inst.status === 'PENDING') {
                if (new Date(inst.dueDate) < today) {
                    overdueCount++;
                } else if (new Date(inst.dueDate) <= in30Days) {
                    upcomingCount++;
                }
            }
        });
    });

    // Serialize Decimal fields
    const serializedLoans = loans.map(loan => ({
        ...loan,
        principal: Number(loan.principal),
        interest: Number(loan.interest),
        totalAmount: Number(loan.totalAmount),
        bank: loan.bank ? {
            ...loan.bank,
            balance: Number(loan.bank.balance)
        } : null,
        installments: loan.installments.map(inst => ({
            ...inst,
            amount: Number(inst.amount)
        }))
    }));

    const serializedActiveLoans = serializedLoans.filter(l => l.status === 'ACTIVE');

    return {
        loans: serializedLoans,
        activeLoans: serializedActiveLoans,
        totalPrincipal,
        totalRemaining,
        overdueInstallmentsCount: overdueCount,
        upcomingInstallmentsCount: upcomingCount
    };
}

// ============= التقرير الشامل =============
export async function getFinancialSummary(
    startDate?: Date,
    endDate?: Date
) {
    const profitLoss = await getProfitLossReport(startDate, endDate);
    const treasury = await getTreasuryStatusReport(startDate, endDate);
    const banks = await getBankMovementsReport(startDate, endDate);
    const loans = await getLoansReport();

    const totalBankBalance = banks.reduce((sum, b) => sum + b.currentBalance, 0);
    const totalAssets = treasury.totalBalance + totalBankBalance;
    const totalLiabilities = loans.totalRemaining;
    const netWorth = totalAssets - totalLiabilities;

    return {
        profitLoss,
        treasury,
        banks,
        loans,
        summary: {
            totalAssets,
            totalLiabilities,
            netWorth,
            profitability: profitLoss.netProfit
        }
    };
}

// ============= تقرير المخزون =============
export async function getInventoryReport(warehouseId?: string) {
    const warehouseFilter = warehouseId && warehouseId !== 'ALL' ? { warehouseId } : {};

    const stockItems = await prisma.stock.findMany({
        where: warehouseFilter,
        include: {
            product: true,
            warehouse: {
                include: {
                    agency: true
                }
            }
        },
        orderBy: {
            quantity: 'desc'
        }
    });

    let totalItems = 0;
    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    const byWarehouse = new Map<string, {
        name: string;
        agencyName: string;
        itemsCount: number;
        totalValue: number;
        items: any[];
    }>();

    stockItems.forEach(item => {
        totalItems += item.quantity;
        const itemValue = item.quantity * Number(item.product.factoryPrice);
        totalValue += itemValue;

        if (item.quantity === 0) outOfStockItems++;
        else if (item.quantity < 10) lowStockItems++; // Consider low stock if less than 10

        if (item.warehouse) {
            const whKey = item.warehouse.id;
            const current = byWarehouse.get(whKey) || {
                name: item.warehouse.name,
                agencyName: item.warehouse.agency.name,
                itemsCount: 0,
                totalValue: 0,
                items: []
            };

            current.itemsCount += item.quantity;
            current.totalValue += itemValue;
            current.items.push({
                productId: item.product.id,
                productName: item.product.name,
                barcode: item.product.barcode,
                quantity: item.quantity,
                factoryPrice: Number(item.product.factoryPrice),
                wholesalePrice: Number(item.product.wholesalePrice),
                retailPrice: Number(item.product.retailPrice),
                totalValue: itemValue,
                stockStatus: item.quantity === 0 ? 'OUT_OF_STOCK' : item.quantity < 10 ? 'LOW_STOCK' : 'IN_STOCK'
            });

            byWarehouse.set(whKey, current);
        }
    });

    return {
        totalItems,
        totalValue,
        lowStockItems,
        outOfStockItems,
        totalProducts: stockItems.length,
        warehouses: Array.from(byWarehouse.values())
    };
}
