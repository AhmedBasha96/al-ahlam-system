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
        
        // Force repId if the user is a SALES_REPRESENTATIVE
        const repFilterId = currentUser.role === 'SALES_REPRESENTATIVE' 
            ? currentUser.id 
            : filters.repId;

        rawSessions = await getSalesSessions({
            repId: repFilterId,
            startDate: filters.start,
            endDate: filters.end
        });
    } catch (e) {
        console.error("Sales Reports fetch error:", e);
    }
    const reps = users.filter((u: any) => u.role === 'SALES_REPRESENTATIVE');

    const sessions = rawSessions.map((s: any) => {
        const processedItems = s.items.map((item: any) => ({
            productId: item.productId,
            productName: item.product?.name || `منتج محذوف (#${item.productId})`,
            quantity: item.quantity,
            price: Number(item.price),
            cost: Number(item.cost || 0),
            discountPercentage: Number(item.discountPercentage || 0),
            taxPercentage: Number(item.taxPercentage || 0),
            unitsPerCarton: Number(item.product?.unitsPerCarton || 1),
            total: (item.quantity * Number(item.price)) * (1 - Number(item.discountPercentage || 0) / 100) * (1 + Number(item.taxPercentage || 0) / 100),
            profit: ((item.quantity * Number(item.price)) * (1 - Number(item.discountPercentage || 0) / 100)) - (item.quantity * Number(item.cost || 0))
        }));

        return {
            id: s.id,
            repId: s.userId,
            repName: s.user.name,
            customerId: s.customerId,
            customerName: s.customer?.name,
            totalAmount: processedItems.reduce((sum: number, item: any) => sum + item.total, 0), // Use recalculated net total
            paidAmount: Number(s.paidAmount),
            remainingAmount: Number(s.remainingAmount),
            paymentType: s.paymentType,
            date: s.createdAt,
            status: s.status, // Added status for the table
            note: s.note,     // Added note for the table
            items: processedItems
        };
    });

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
                            defaultValue={currentUser.role === 'SALES_REPRESENTATIVE' ? currentUser.id : filters.repId}
                            disabled={currentUser.role === 'SALES_REPRESENTATIVE'}
                            className={`w-full border rounded-xl p-2.5 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-700 ${currentUser.role === 'SALES_REPRESENTATIVE' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <option value="">كل المناديب</option>
                            {reps.map((r: any) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        {currentUser.role === 'SALES_REPRESENTATIVE' && (
                            <input type="hidden" name="repId" value={currentUser.id} />
                        )}
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
