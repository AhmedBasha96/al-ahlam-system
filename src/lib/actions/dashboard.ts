'use server';

import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { LOW_STOCK_THRESHOLD } from '@/lib/constants';
import { getCurrentUser } from '@/lib/actions';

export interface ProductAlert {
    productId: string;
    productName: string;
    warehouseName: string;
    currentQuantity: number;
    severity: 'critical' | 'warning';
}

export interface DashboardStats {
    totalAgencies: number;
    totalWarehouses: number;
    totalProducts: number;
    totalUsers: number;
    totalCustomers: number;
    todaySales: number;
    todayTransactions: number;
    weekSales: number;
    lastWeekSales: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockProducts: ProductAlert[];
    outOfStockProducts: ProductAlert[];
    recentTransactions: Array<{
        id: string;
        type: string;
        totalAmount: number;
        createdAt: Date;
        user: { name: string };
        customer?: { name: string } | null;
        items: Array<{
            quantity: number;
            product: { name: string };
        }>;
    }>;
    loadingRequests?: {
        pendingApproval: number;
        pendingFulfillment: number;
        userPending?: number;
    };
    pendingSalesApprovals?: number;
}

export interface RepDashboardStats {
    todaySales: number;
    todayCollections: number;
    monthlySales: number;
    monthlyCollections: number;
    salesTarget: number;
    collectionTarget: number;
    totalCustomerDebt: number;
    totalInventoryValue: number;
    recentTransactions: any[];
    inventory: any[];
}

export interface WarehouseDashboardStats {
    warehouseName: string;
    totalProducts: number;
    totalStockValue: number;
    lowStockItems: ProductAlert[];
    outOfStockItems: ProductAlert[];
    recentTransactions: any[];
    inventory: any[];
}

export interface AccountantDashboardStats {
    treasuryBalance: number;
    todayCashIn: number;
    todayCashOut: number;
    pendingReturnApprovalsCount: number;
    recentTransactions: any[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const currentUser = await getCurrentUser();
        const isAdminOrManager = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
        const isRestricted = !isAdminOrManager || currentUser.role === 'SALES_RECORDER';

        let agencyFilter: any = {};
        let warehouseFilter: any = { NOT: { name: { startsWith: 'عهدة المندوب:' } } };
        let transactionFilter: any = {};

        if (isRestricted) {
            const agencyIds = (currentUser as any).agencyIds || [];
            if (agencyIds.length > 0) {
                agencyFilter = { id: { in: agencyIds } };
                transactionFilter.agencyId = { in: agencyIds };
                warehouseFilter.agencyId = { in: agencyIds };
            }

            // If warehouse keeper has specific warehouses, filter stock and transactions
            if (currentUser.role === 'WAREHOUSE_KEEPER') {
                const warehouseIds = (currentUser as any).warehouseIds || [];
                if (warehouseIds.length > 0) {
                    warehouseFilter.id = { in: warehouseIds };
                    transactionFilter.warehouseId = { in: warehouseIds };
                }
            }

            if (currentUser.role === 'SALES_REPRESENTATIVE') {
                transactionFilter.userId = currentUser.id;
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Split queries into batches to avoid exceeding connection limit
        const [totalAgencies, totalWarehouses] = await Promise.all([
            prisma.agency.count({ where: agencyFilter }),
            prisma.warehouse.count({
                where: warehouseFilter
            }),
        ]);

        const [totalProducts, totalUsers, totalCustomers] = await Promise.all([
            prisma.product.count({ where: isRestricted ? { agencyId: { in: (currentUser as any).agencyIds } } : {} }),
            prisma.user.count({ where: isRestricted ? { agencies: { some: { id: { in: (currentUser as any).agencyIds } } } } : {} }),
            prisma.customer.count({ where: isRestricted ? { agencyId: { in: (currentUser as any).agencyIds } } : {} }),
        ]);

        // Batch 2: Transaction queries
        const [todayTransactions, weekTransactions] = await Promise.all([
            (prisma as any).transaction.findMany({
                where: { ...transactionFilter, type: 'SALE', totalAmount: { gt: 0 }, createdAt: { gte: today } },
                select: { totalAmount: true },
            }),
            (prisma as any).transaction.findMany({
                where: { ...transactionFilter, type: 'SALE', totalAmount: { gt: 0 }, createdAt: { gte: weekAgo, lt: today } },
                select: { totalAmount: true },
            }),
        ]);

        const lastWeekTransactions = await (prisma as any).transaction.findMany({
            where: { ...transactionFilter, type: 'SALE', totalAmount: { gt: 0 }, createdAt: { gte: twoWeeksAgo, lt: weekAgo } },
            select: { totalAmount: true },
        });

        // Batch 3: Stock queries - Aggregated by product
        const allProducts = await (prisma as any).product.findMany({
            where: isRestricted ? { agencyId: { in: (currentUser as any).agencyIds } } : {},
            include: {
                stocks: {
                    where: {
                        warehouse: warehouseFilter
                    },
                    include: {
                        warehouse: true
                    }
                }
            }
        });

        const lowStockProducts: ProductAlert[] = [];
        const outOfStockProducts: ProductAlert[] = [];

        allProducts.forEach((product: any) => {
            const totalQuantity = (product.stocks as any[]).reduce((sum: number, s: any) => sum + s.quantity, 0);

            if (totalQuantity === 0) {
                outOfStockProducts.push({
                    productId: product.id,
                    productName: product.name,
                    warehouseName: "جميع المخازن",
                    currentQuantity: 0,
                    severity: 'critical'
                });
            } else if (totalQuantity <= LOW_STOCK_THRESHOLD) {
                // Find which warehouse has low stock for the alert, or just say total
                (product.stocks as any[]).forEach((s: any) => {
                    if (s.quantity <= LOW_STOCK_THRESHOLD && s.quantity > 0) {
                        lowStockProducts.push({
                            productId: product.id,
                            productName: product.name,
                            warehouseName: s.warehouse.name,
                            currentQuantity: s.quantity,
                            severity: 'warning'
                        });
                    }
                });
            }
        });

        const lowStockCount = lowStockProducts.length;
        const outOfStockCount = outOfStockProducts.length;

        // Batch 4: Recent transactions
        const recentTransactions = await (prisma as any).transaction.findMany({
            where: transactionFilter,
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                totalAmount: true,
                createdAt: true,
                user: { select: { name: true } },
                customer: { select: { name: true } },
                items: {
                    select: {
                        quantity: true,
                        product: { select: { name: true } }
                    }
                }
            },
        });

    // Batch 5: Pending Approvals
    const pendingSalesApprovals = await (prisma as any).transaction.count({
        where: { 
            status: 'PENDING', 
            type: 'SALE',
            ...(isRestricted ? { agencyId: { in: (currentUser as any).agencyIds } } : {})
        }
    });

    const todaySales = todayTransactions.reduce(
            (sum: number, tx: any) => sum + Number(tx.totalAmount),
            0
        );

        const weekSales = weekTransactions.reduce(
            (sum: number, tx: any) => sum + Number(tx.totalAmount),
            0
        );

        const lastWeekSales = lastWeekTransactions.reduce(
            (sum: number, tx: any) => sum + Number(tx.totalAmount),
            0
        );

        return {
            totalAgencies,
            totalWarehouses,
            totalProducts,
            totalUsers,
            totalCustomers,
            todaySales,
            todayTransactions: todayTransactions.length,
            weekSales,
            lastWeekSales,
            lowStockCount,
            outOfStockCount,
            lowStockProducts,
            outOfStockProducts,
            recentTransactions: recentTransactions.map((tx: any) => ({
                ...tx,
                totalAmount: Number(tx.totalAmount),
            })),
            loadingRequests: {
                pendingApproval: await prisma.loadingRequest.count({
                    where: { 
                        status: 'PENDING',
                        ...(isRestricted && currentUser.role === 'MANAGER' ? { agencyId: { in: (currentUser as any).agencyIds } } : {})
                    }
                }),
                pendingFulfillment: await prisma.loadingRequest.count({
                    where: { 
                        status: 'APPROVED',
                        ...(isRestricted && currentUser.role === 'WAREHOUSE_KEEPER' ? { warehouseId: { in: (currentUser as any).warehouseIds } } : {})
                    }
                }),
                userPending: currentUser.role === 'SALES_REPRESENTATIVE' 
                    ? await prisma.loadingRequest.count({ where: { repId: currentUser.id, status: { in: ['PENDING', 'APPROVED'] } } })
                    : undefined
            },
            pendingSalesApprovals
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

export async function getWarehouseDashboardData(): Promise<WarehouseDashboardStats> {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== 'WAREHOUSE_KEEPER') {
            throw new Error('Unauthorized');
        }

        const warehouseIds: string[] = (currentUser as any).warehouseIds || [];
        if (warehouseIds.length === 0) {
            throw new Error('أمين المخزن غير مرتبط بأي مخزن حالياً (يرجى مراجعة الإدارة لإقرانه بمخزن من شاشة المستخدمين)');
        }

        // Fetch all assigned warehouses
        const assignedWarehouses = await prisma.warehouse.findMany({
            where: { id: { in: warehouseIds } },
            include: { agency: true }
        });

        if (assignedWarehouses.length === 0) throw new Error('Warehouses not found');

        // Aggregate stocks from all assigned warehouses
        const stocks = await prisma.stock.findMany({
            where: { warehouseId: { in: warehouseIds } },
            include: { product: true, warehouse: { select: { name: true } } }
        });

        const inventory = stocks.map(s => {
            const unitPrice = Number(s.product.retailPrice) / (s.product.unitsPerCarton || 1);
            return {
                productId: s.product.id,
                productName: s.product.name,
                warehouseName: (s as any).warehouse?.name || '',
                quantity: s.quantity,
                price: Number(s.product.retailPrice),
                value: s.quantity * unitPrice
            };
        });

        const totalStockValue = inventory.reduce((sum, item) => sum + item.value, 0);
        const lowStockItems: ProductAlert[] = inventory
            .filter(item => item.quantity > 0 && item.quantity <= LOW_STOCK_THRESHOLD)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                warehouseName: item.warehouseName,
                currentQuantity: item.quantity,
                severity: 'warning' as const
            }));

        const outOfStockItems: ProductAlert[] = inventory
            .filter(item => item.quantity === 0)
            .map(item => ({
                productId: item.productId,
                productName: item.productName,
                warehouseName: item.warehouseName,
                currentQuantity: 0,
                severity: 'critical' as const
            }));

        const recentTransactions = await (prisma as any).transaction.findMany({
            where: { warehouseId: { in: warehouseIds } },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } },
                customer: { select: { name: true } },
                supplier: { select: { name: true } },
                items: { include: { product: { select: { name: true } } } }
            }
        });

        const warehouseLabel = assignedWarehouses.length === 1
            ? assignedWarehouses[0].name
            : `${assignedWarehouses.length} مخازن`;

        return {
            warehouseName: warehouseLabel,
            totalProducts: inventory.filter(i => i.quantity > 0).length,
            totalStockValue,
            lowStockItems,
            outOfStockItems,
            recentTransactions: recentTransactions.map((tx: any) => ({
                ...tx,
                totalAmount: Number(tx.totalAmount),
                items: (tx.items || []).map((i: any) => ({
                    productName: i.product?.name || 'صنف غير معروف',
                    quantity: i.quantity
                }))
            })),
            inventory: inventory.filter(i => i.quantity > 0).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
        };
    } catch (error: any) {
        console.error('getWarehouseDashboardData error:', error);
        throw error;
    }
}

export async function getRepDashboardData(): Promise<RepDashboardStats> {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== 'SALES_REPRESENTATIVE') {
            throw new Error('Unauthorized');
        }

    const dbUser = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { name: true, pricingType: true }
    });

    if (!dbUser) throw new Error('User not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. Target & Performance
    const target = await prisma.salesTarget.findUnique({
        where: { userId_month_year: { userId: currentUser.id, month, year } }
    });

    const salesEntries = await prisma.journalEntry.findMany({
        where: {
            userId: currentUser.id,
            type: 'DEBIT',
            referenceType: 'SALE',
            createdAt: { gte: startDate, lte: endDate }
        }
    });
    const monthlySales = salesEntries.reduce((sum, e) => sum + Number(e.amount), 0);

    const collectionEntries = await prisma.journalEntry.findMany({
        where: {
            userId: currentUser.id,
            type: 'DEBIT',
            referenceType: 'COLLECTION',
            createdAt: { gte: startDate, lte: endDate }
        }
    });
    const monthlyCollections = collectionEntries.reduce((sum, e) => sum + Number(e.amount), 0);

    // 2. Today's metrics
    const todaySales = salesEntries
        .filter(e => e.createdAt >= today)
        .reduce((sum, e) => sum + Number(e.amount), 0);

    const todayCollections = collectionEntries
        .filter(e => e.createdAt >= today)
        .reduce((sum, e) => sum + Number(e.amount), 0);

    // 3. Customer Debt
    const customers = await prisma.customer.findMany({
        where: { representativeId: currentUser.id },
        include: {
            transactions: {
                where: { status: 'ACTIVE' },
                select: { remainingAmount: true }
            }
        }
    });

    const totalCustomerDebt = customers.reduce((sum, c) => {
        return sum + c.transactions.reduce((tSum, t) => tSum + Number(t.remainingAmount || 0), 0);
    }, 0);

    // 4. Inventory (Rep Warehouse)
    const repWarehouse = await prisma.warehouse.findFirst({
        where: { name: `عهدة المندوب: ${dbUser.name}` }
    });

    let inventory: any[] = [];
    let totalInventoryValue = 0;

    if (repWarehouse) {
        const stocks = await prisma.stock.findMany({
            where: { warehouseId: repWarehouse.id, quantity: { gt: 0 } },
            include: { product: true }
        });
        const isWholesale = dbUser.pricingType === 'WHOLESALE';
        inventory = stocks.map(s => {
            const price = isWholesale ? Number(s.product.wholesalePrice) : Number(s.product.retailPrice);
            const unitPrice = price / (s.product.unitsPerCarton || 1);
            return {
                productId: s.product.id,
                productName: s.product.name,
                quantity: s.quantity,
                price: price,
                value: s.quantity * unitPrice
            };
        });
        totalInventoryValue = inventory.reduce((sum, item) => sum + item.value, 0);
    }

    // 5. Recent Transactions
    const recentTransactions = await (prisma as any).transaction.findMany({
        where: { userId: currentUser.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            customer: { select: { name: true } },
            items: { include: { product: { select: { name: true } } } }
        }
    });

    return {
        todaySales,
        todayCollections,
        monthlySales,
        monthlyCollections,
        salesTarget: Number(target?.salesTarget || 0),
        collectionTarget: Number(target?.collectionTarget || 0),
        totalCustomerDebt,
        totalInventoryValue,
        recentTransactions: recentTransactions.map((tx: any) => ({
            ...tx,
            totalAmount: Number(tx.totalAmount),
            items: tx.items.map((i: any) => ({
                productName: i.product.name,
                quantity: i.quantity
            }))
        })),
        inventory: inventory.slice(0, 5) // Just top 5 for dashboard
    };
    } catch (error) {
        console.error('getRepDashboardData error:', error);
        throw error;
    }
}

export async function getAccountantDashboardData(): Promise<AccountantDashboardStats> {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser.role !== 'ACCOUNTANT' && currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
            throw new Error('Unauthorized');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Treasury Balance
        const debits = await prisma.journalEntry.aggregate({ where: { type: 'DEBIT' }, _sum: { amount: true } });
        const credits = await prisma.journalEntry.aggregate({ where: { type: 'CREDIT' }, _sum: { amount: true } });
        const treasuryBalance = Number(debits._sum.amount || 0) - Number(credits._sum.amount || 0);

        // 2. Today Cash Flow
        const todayDebits = await prisma.journalEntry.aggregate({ 
            where: { type: 'DEBIT', createdAt: { gte: today } },
            _sum: { amount: true } 
        });
        const todayCredits = await prisma.journalEntry.aggregate({ 
            where: { type: 'CREDIT', createdAt: { gte: today } },
            _sum: { amount: true } 
        });

        // 3. Pending Approvals
        const pendingCount = await (prisma as any).transaction.count({
            where: { status: 'PENDING', type: { in: ['RETURN_IN', 'RETURN_OUT'] } }
        });

        // 4. Recent Transactions (Journal Entries)
        const recentEntries = await prisma.journalEntry.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } }, agency: { select: { name: true } } }
        });

        return {
            treasuryBalance,
            todayCashIn: Number(todayDebits._sum.amount || 0),
            todayCashOut: Number(todayCredits._sum.amount || 0),
            pendingReturnApprovalsCount: pendingCount,
            recentTransactions: recentEntries.map(e => ({
                id: e.id,
                date: e.createdAt,
                amount: Number(e.amount),
                type: e.type,
                referenceType: e.referenceType,
                description: e.description,
                userName: e.user?.name,
                agencyName: e.agency?.name
            }))
        };
    } catch (error) {
        console.error('getAccountantDashboardData error:', error);
        throw error;
    }
}

export interface RepSummary {
    id: string;
    name: string;
    monthlySales: number;
    monthlyCollections: number;
    salesTarget: number;
    totalCustomerDebt: number;
    inventoryCount: number;
}

export async function getRepsSummary(): Promise<RepSummary[]> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const reps = await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' },
        select: { id: true, name: true }
    });

    const results: RepSummary[] = [];

    for (const rep of reps) {
        // Monthly Sales
        const salesEntries = await prisma.journalEntry.findMany({
            where: {
                userId: rep.id,
                type: 'DEBIT',
                referenceType: 'SALE',
                createdAt: { gte: startDate, lte: endDate }
            }
        });
        const monthlySales = salesEntries.reduce((sum, e) => sum + Number(e.amount), 0);

        // Monthly Collections
        const collectionEntries = await prisma.journalEntry.findMany({
            where: {
                userId: rep.id,
                type: 'DEBIT',
                referenceType: 'COLLECTION',
                createdAt: { gte: startDate, lte: endDate }
            }
        });
        const monthlyCollections = collectionEntries.reduce((sum, e) => sum + Number(e.amount), 0);

        // Sales Target
        const target = await prisma.salesTarget.findUnique({
            where: { userId_month_year: { userId: rep.id, month, year } }
        });

        // Customer Debt
        const customers = await prisma.customer.findMany({
            where: { representativeId: rep.id },
            include: {
                transactions: {
                    where: { status: 'ACTIVE' },
                    select: { remainingAmount: true }
                }
            }
        });
        const totalCustomerDebt = customers.reduce((sum, c) =>
            sum + c.transactions.reduce((tSum, t) => tSum + Number(t.remainingAmount || 0), 0), 0);

        // Inventory count (rep virtual warehouse)
        const repWarehouse = await prisma.warehouse.findFirst({
            where: { name: `عهدة المندوب: ${rep.name}` }
        });
        let inventoryCount = 0;
        if (repWarehouse) {
            const stocks = await prisma.stock.aggregate({
                where: { warehouseId: repWarehouse.id, quantity: { gt: 0 } },
                _sum: { quantity: true }
            });
            inventoryCount = Number(stocks._sum.quantity || 0);
        }

        results.push({
            id: rep.id,
            name: rep.name,
            monthlySales,
            monthlyCollections,
            salesTarget: Number(target?.salesTarget || 0),
            totalCustomerDebt,
            inventoryCount
        });
    }

    return results;
}
