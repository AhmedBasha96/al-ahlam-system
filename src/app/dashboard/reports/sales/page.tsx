import { getSalesSessions, getUsers, getCurrentUser } from "@/lib/actions";
import Link from "next/link";
import SalesHistoryTable from "./sales-history-table";

export const dynamic = 'force-dynamic';

export default async function SalesReportsPage({
    searchParams
}: {
    searchParams: Promise<{ repId?: string; start?: string; end?: string }>
}) {
    const filters = await searchParams;
    let users: any[] = [];
    let currentUser: any = { role: 'GUEST' };
    let rawSessions: any[] = [];

    try {
        users = await getUsers();
        currentUser = await getCurrentUser();
        rawSessions = await getSalesSessions({
            repId: filters.repId,
            startDate: filters.start,
            endDate: filters.end
        });
    } catch (e) {
        console.error("Sales Reports fetch error:", e);
    }
    const reps = users.filter((u: any) => u.role === 'SALES_REPRESENTATIVE');

    const sessions = rawSessions.map((s: any) => ({
        id: s.id,
        repId: s.userId,
        repName: s.user.name,
        customerId: s.customerId,
        customerName: s.customer?.name,
        totalAmount: Number(s.totalAmount),
        paidAmount: Number(s.paidAmount),
        remainingAmount: Number(s.remainingAmount),
        paymentType: s.paymentType,
        date: s.createdAt,
        items: s.items.map((item: any) => ({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.quantity,
            price: Number(item.price),
            total: item.quantity * Number(item.price)
        }))
    }));

    const totalPeriodSales = sessions.reduce((sum, s) => sum + s.totalAmount, 0);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">تقارير المبيعات (تصفية المناديب)</h1>
                    <p className="text-gray-500 mt-2">عرض وتدقيق سجل مبيعات المناديب بناءً على جلسات الجرد</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-bold">إجمالي مبيعات الفترة</p>
                        <p className="text-xl font-black text-emerald-700">{totalPeriodSales.toLocaleString('en-US')} ج.م</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <form className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">المندوب</label>
                        <select
                            name="repId"
                            defaultValue={filters.repId}
                            className="w-full border rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700"
                        >
                            <option value="">كل المناديب</option>
                            {reps.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">من تاريخ</label>
                        <input
                            type="date"
                            name="start"
                            defaultValue={filters.start}
                            className="w-full border rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">إلى تاريخ</label>
                        <input
                            type="date"
                            name="end"
                            defaultValue={filters.end}
                            className="w-full border rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-200">
                            تطبيق الفلتر 🔍
                        </button>
                    </div>
                </form>
            </div>

            <SalesHistoryTable sessions={sessions} userRole={currentUser?.role} />
        </div>
    );
}
