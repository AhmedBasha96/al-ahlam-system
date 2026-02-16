import { getUsers, getRepDebtBreakdown, getCurrentUser } from "@/lib/actions";
import RepDebtBreakdown from "@/app/dashboard/reps/[id]/rep-debt-breakdown";
import { Users, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function RepDebtsInAccounts() {
    const allUsers = await getUsers();
    const reps = allUsers.filter((u: any) => u.role === 'SALES_REPRESENTATIVE');

    // Fetch breakdown for all reps
    const repsWithDebts = await Promise.all(reps.map(async (rep: any) => {
        const breakdown = await getRepDebtBreakdown(rep.id);
        const totalDebt = breakdown.reduce((sum, c) => sum + c.debt, 0);
        return {
            ...rep,
            breakdown,
            totalDebt
        };
    }));

    const grandTotalCustomersDebt = repsWithDebts.reduce((sum, r) => sum + r.totalDebt, 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                            <DollarSign className="w-8 h-8" />
                        </div>
                        تحصيل مديونيات العملاء (بواسطة المناديب)
                    </h1>
                    <p className="text-slate-500 mt-2">إدارة سداد ديون العملاء لكل مندوب وتصفية عهدهم المالية</p>
                </div>
                <Link href="/dashboard/accounts" className="flex items-center gap-2 text-indigo-600 font-bold hover:underline">
                    <ArrowLeft className="w-4 h-4" /> العودة للحسابات
                </Link>
            </div>

            {/* Stats */}
            <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg border border-emerald-500 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-4 rounded-xl">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">إجمالي المبالغ بالخارج (آجل عملاء)</p>
                        <p className="text-4xl font-black">{grandTotalCustomersDebt.toLocaleString()} ج.م</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-emerald-100 text-xs">عدد المناديب النشطين</p>
                    <p className="text-2xl font-bold">{reps.length}</p>
                </div>
            </div>

            {/* Reps List with their Breakdowns */}
            <div className="space-y-6">
                {repsWithDebts.map(rep => (
                    <div key={rep.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                    {rep.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{rep.name}</h2>
                                    <p className="text-xs text-slate-400">@{rep.username}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase">مديونية عملاء المندوب</p>
                                <p className="text-2xl font-black text-rose-600">{rep.totalDebt.toLocaleString()} ج.م</p>
                            </div>
                        </div>

                        {/* Reuse the component but it will be managed by Accounts now */}
                        <RepDebtBreakdown repId={rep.id} customers={rep.breakdown} />
                    </div>
                ))}

                {repsWithDebts.length === 0 && (
                    <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">لا يوجد مناديب مبيعات حالياً في النظام.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
