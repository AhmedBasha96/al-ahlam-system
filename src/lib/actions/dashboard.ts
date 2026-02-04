'use server';

import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

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
    }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Split queries into batches to avoid exceeding connection limit
        // Batch 1: Basic counts
        const [
            totalAgencies,
            totalWarehouses,
            totalProducts,
            totalUsers,
            totalCustomers,
        ] = await Promise.all([
            prisma.agency.count(),
            prisma.warehouse.count(),
            prisma.product.count(),
            prisma.user.count(),
            prisma.customer.count(),
        ]);

        // Batch 2: Transaction queries
        const [
            todayTransactions,
            weekTransactions,
            lastWeekTransactions,
        ] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    type: 'SALE',
                    createdAt: { gte: today },
                },
                select: { totalAmount: true },
            }),
            prisma.transaction.findMany({
                where: {
                    type: 'SALE',
                    createdAt: { gte: weekAgo, lt: today },
                },
                select: { totalAmount: true },
            }),
            prisma.transaction.findMany({
                where: {
                    type: 'SALE',
                    createdAt: { gte: twoWeeksAgo, lt: weekAgo },
                },
                select: { totalAmount: true },
            }),
        ]);

        // Batch 3: Stock alerts with details
        const [
            lowStockItems,
            outOfStockItems,
            lowStockDetails,
            outOfStockDetails,
        ] = await Promise.all([
            prisma.stock.count({
                where: { quantity: { lt: 10, gt: 0 } },
            }),
            prisma.stock.count({
                where: { quantity: 0 },
            }),
            prisma.stock.findMany({
                where: { quantity: { lt: 10, gt: 0 } },
                take: 10,
                orderBy: { quantity: 'asc' },
                include: {
                    product: { select: { name: true } },
                    warehouse: { select: { name: true } },
                },
            }),
            prisma.stock.findMany({
                where: { quantity: 0 },
                take: 10,
                include: {
                    product: { select: { name: true } },
                    warehouse: { select: { name: true } },
                },
            }),
        ]);

        // Batch 4: Recent transactions
        const recentTransactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                totalAmount: true,
                createdAt: true,
                user: { select: { name: true } },
                customer: { select: { name: true } },
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
            lowStockCount: lowStockItems,
            outOfStockCount: outOfStockItems,
            lowStockProducts: lowStockDetails.map(stock => ({
                productId: stock.productId,
                productName: stock.product.name,
                warehouseName: stock.warehouse.name,
                currentQuantity: stock.quantity,
                severity: 'warning' as const,
            })),
            outOfStockProducts: outOfStockDetails.map(stock => ({
                productId: stock.productId,
                productName: stock.product.name,
                warehouseName: stock.warehouse.name,
                currentQuantity: 0,
                severity: 'critical' as const,
            })),
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
