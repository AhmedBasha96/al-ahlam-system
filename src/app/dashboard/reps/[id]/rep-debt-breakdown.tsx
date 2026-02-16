'use client';

import { useState } from "react";
import { recordDebtCollection } from "@/lib/actions";

type CustomerDebt = {
    id: string;
    name: string;
    debt: number;
}

type Props = {
    repId: string;
    customers: CustomerDebt[];
}

export default function RepDebtBreakdown({ repId, customers }: Props) {
    const [isCollecting, setIsCollecting] = useState<string | null>(null);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleCollection(customerId: string) {
        if (!amount || Number(amount) <= 0) return;
        setLoading(true);
        try {
            await recordDebtCollection(customerId, Number(amount), `تحصيل مديونية عن طريق المندوب`, repId);
            setIsCollecting(null);
            setAmount("");
            // Refresh logic usually handled by revalidatePath in action
        } catch (error) {
            alert("خطأ في التحصيل");
        } finally {
            setLoading(false);
        }
    }

    const totalCustomersDebt = customers.reduce((sum, c) => sum + c.debt, 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">تفاصيل مديونية العملاء (التابعين للمندوب)</h3>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    الإجمالي: {totalCustomersDebt.toLocaleString()} ج.م
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                        <tr>
                            <th className="p-4">اسم العميل</th>
                            <th className="p-4 text-center">المديونية الحالية</th>
                            <th className="p-4 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {customers.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">{c.name}</td>
                                <td className="p-4 text-center text-red-600 font-mono font-bold">{c.debt.toLocaleString()} ج.م</td>
                                <td className="p-4 text-center">
                                    {isCollecting === c.id ? (
                                        <div className="flex items-center gap-2 justify-center animate-in slide-in-from-right-4">
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="المبلغ"
                                                className="w-24 border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                            <button
                                                onClick={() => handleCollection(c.id)}
                                                disabled={loading}
                                                className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {loading ? "..." : "تأكيد"}
                                            </button>
                                            <button
                                                onClick={() => setIsCollecting(null)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCollecting(c.id)}
                                            className="text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            تحصيل مبلع
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-400 italic">لا توجد مديونيات حالية لعملاء هذا المندوب.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
