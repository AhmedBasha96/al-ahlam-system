import { getCurrentUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import ApprovalsList from "./approvals-list";

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'ACCOUNTANT') {
        redirect('/dashboard');
    }

    const pendingTransactionsRaw = await prisma.transaction.findMany({
        where: { status: 'PENDING' },
        include: {
            user: true,
            agency: true,
            supplier: true,
            warehouse: true,
            items: {
                include: { product: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const pendingTransactions = pendingTransactionsRaw.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        createdAt: tx.createdAt.toISOString(),
        totalAmount: Number(tx.totalAmount),
        user: tx.user ? { name: tx.user.name } : null,
        supplier: tx.supplier ? { name: tx.supplier.name } : null,
        warehouse: tx.warehouse ? { name: tx.warehouse.name } : null,
        items: tx.items.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            product: item.product ? { name: item.product.name } : null
        }))
    }));

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">طلبات قيد الاعتماد</h1>
                <p className="text-slate-500 font-medium mt-1">مراجعة واعتماد مرتجعات المخازن للمصانع والعمليات المعلقة</p>
            </div>

            <ApprovalsList initialTransactions={pendingTransactions} />
        </div>
    );
}
