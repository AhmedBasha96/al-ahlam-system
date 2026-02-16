'use server';

import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

import { LOW_STOCK_THRESHOLD } from '@/lib/constants';

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
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const currentUser = await (await import('@/lib/actions')).getCurrentUser();
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

            // If warehouse keeper has specific warehouse, filter stock and possibly transactions
            if (currentUser.role === 'WAREHOUSE_KEEPER' && (currentUser as any).warehouseId) {
                warehouseFilter.id = (currentUser as any).warehouseId;
                transactionFilter.warehouseId = (currentUser as any).warehouseId;
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

        allProducts.forEach(product => {
            const totalQuantity = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

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
                product.stocks.forEach(s => {
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

        const todaySales = todayTransactions.reduce(
            (sum, tx) => sum + Number(tx.totalAmount),
            0
        );

        const weekSales = weekTransactions.reduce(
            (sum, tx) => sum + Number(tx.totalAmount),
            0
        );

        const lastWeekSales = lastWeekTransactions.reduce(
            (sum, tx) => sum + Number(tx.totalAmount),
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
            recentTransactions: recentTransactions.map(tx => ({
                ...tx,
                totalAmount: Number(tx.totalAmount),
            })),
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}
