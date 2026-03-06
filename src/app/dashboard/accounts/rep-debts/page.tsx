import { getUsers, getRepDebtBreakdown, getCurrentUser, getRepAccountability } from "@/lib/actions";
import RepDebtBreakdown from "@/app/dashboard/reps/[id]/rep-debt-breakdown";
import RepCustodyManager from "./rep-custody-manager";
import { Users, DollarSign, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function RepDebtsInAccounts() {
    const allUsers = await getUsers();
    const reps = allUsers.filter((u: any) => u.role === 'SALES_REPRESENTATIVE');

    // Fetch breakdown and accountability for all reps
    const repsWithDebts = await Promise.all(reps.map(async (rep: any) => {
        const [breakdown, accountability] = await Promise.all([
            getRepDebtBreakdown(rep.id),
            getRepAccountability(rep.id)
        ]);

        const totalDebt = breakdown.reduce((sum, c) => sum + c.debt, 0);
        return {
            ...rep,
            breakdown,
            totalDebt,
            accountability
        };
    }));

    const grandTotalCustomersDebt = repsWithDebts.reduce((sum, r) => sum + r.totalDebt, 0);
    const grandTotalCustody = repsWithDebts.reduce((sum, r) => sum + r.accountability.currentCustody, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
                        <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 shadow-sm">
                            <DollarSign className="w-8 h-8" />
                        </div>
                        إدارة تحصيلات وعهد المناديب
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">متابعة مديونيات العملاء وتصفية المبالغ النقدية المحصلة من المناديب</p>
                </div>
                <Link href="/dashboard/accounts" className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-indigo-600 font-bold hover:shadow-md transition-all">
                    <ArrowLeft className="w-4 h-4" /> العودة للحسابات
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-3xl p-8 text-white shadow-xl border border-rose-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md">
                            <Users className="w-10 h-10" />
                        </div>
                        <div>
                            <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1">إجمالي مبالغ العملاء بالخارج (آجل)</p>
                            <p className="text-4xl font-black">{grandTotalCustomersDebt.toLocaleString()} <span className="text-xl">ج.م</span></p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl border border-emerald-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all" />
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="bg-white/20 p-5 rounded-2xl backdrop-blur-md">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <div>
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">إجمالي العهد النقدية (تحصيلات مع المناديب)</p>
                            <p className="text-4xl font-black">{grandTotalCustody.toLocaleString()} <span className="text-xl">ج.م</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reps List with their Breakdowns */}
            <div className="space-y-8">
                {repsWithDebts.map(rep => (
                    <div key={rep.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-slate-50 pb-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100">
                                    {rep.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800">{rep.name}</h2>
                                    <p className="text-sm text-slate-400 font-medium">@{rep.username} • مندوب مبيعات</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 w-full lg:w-auto">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">مديونية عملاء المندوب</p>
                                    <p className="text-2xl font-black text-rose-500">{rep.totalDebt.toLocaleString()} <span className="text-sm">ج.م</span></p>
                                </div>
                                <div className="text-right border-r border-slate-100 pr-8">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">إجمالي المحصل (عهدة)</p>
                                    <p className="text-2xl font-black text-emerald-600">{rep.accountability.currentCustody.toLocaleString()} <span className="text-sm">ج.م</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Debt Breakdown Component */}
                        <div className="mb-8">
                            <RepDebtBreakdown repId={rep.id} customers={rep.breakdown} />
                        </div>

                        {/* Custody Management Component */}
                        <RepCustodyManager
                            repId={rep.id}
                            repName={rep.name}
                            custody={rep.accountability.currentCustody}
                        />
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
