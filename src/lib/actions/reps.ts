
'use server';

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../actions";

export async function getSalesReps() {
    return await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' },
        select: { id: true, name: true, username: true }
    });
}

export async function upsertSalesTarget(
    userId: string,
    month: number,
    year: number,
    salesTarget: number,
    collectionTarget: number
) {
    try {
        await prisma.salesTarget.upsert({
            where: {
                userId_month_year: { userId, month, year }
            },
            create: {
                userId,
                month,
                year,
                salesTarget,
                collectionTarget
            },
            update: {
                salesTarget,
                collectionTarget
            }
        });

        revalidatePath('/dashboard/reps/targets');
        return { success: true };
    } catch (error) {
        console.error("upsertSalesTarget error:", error);
        return { success: false, error: String(error) };
    }
}

export async function getRepsPerformance(month: number, year: number) {
    const reps = await prisma.user.findMany({
        where: { role: 'SALES_REPRESENTATIVE' },
        include: {
            targets: {
                where: { month, year }
            }
        }
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const performance = await Promise.all(reps.map(async (rep) => {
        const target = rep.targets[0] || { salesTarget: 0, collectionTarget: 0 };
        
        // Actual Sales (DEBIT entries of type SALE for this rep)
        const salesEntries = await prisma.journalEntry.findMany({
            where: {
                userId: rep.id,
                type: 'DEBIT',
                referenceType: 'SALE',
                createdAt: { gte: startDate, lte: endDate }
            }
        });
        const actualSales = salesEntries.reduce((sum, e) => sum + Number(e.amount), 0);

        // Actual Collections (DEBIT entries of type COLLECTION for this rep)
        const collectionEntries = await prisma.journalEntry.findMany({
            where: {
                userId: rep.id,
                type: 'DEBIT',
                referenceType: 'COLLECTION',
                createdAt: { gte: startDate, lte: endDate }
            }
        });
        const actualCollections = collectionEntries.reduce((sum, e) => sum + Number(e.amount), 0);

        return {
            id: rep.id,
            name: rep.name,
            salesTarget: Number(target.salesTarget),
            collectionTarget: Number(target.collectionTarget),
            actualSales,
            actualCollections,
            salesProgress: target.salesTarget > 0 ? (actualSales / Number(target.salesTarget)) * 100 : 0,
            collectionProgress: target.collectionTarget > 0 ? (actualCollections / Number(target.collectionTarget)) * 100 : 0
        };
    }));

    return performance;
}
