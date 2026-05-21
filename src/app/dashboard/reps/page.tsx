import { getUsers, getCurrentUser } from "@/lib/actions";
import { getRepsSummary } from "@/lib/actions/dashboard";
import Link from "next/link";
import { Users, TrendingUp, Banknote, Package, Target } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function RepsListPage() {
    const user = await getCurrentUser();
    const repsData = await getRepsSummary().catch(() => []);

    const now = new Date();
    const monthLabel = now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">أداء المناديب</h1>
                    <p className="text-gray-500 text-sm mt-1">إحصائيات شهر {monthLabel}</p>
                </div>
                <Link href="/dashboard/reps/targets" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-md">
                    إدارة التارجت
                </Link>
            </div>

            {repsData.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 font-medium">لا يوجد مناديب مسجلين في النظام</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                            <div className="text-2xl font-black text-emerald-700">{repsData.length}</div>
                            <div className="text-xs text-emerald-600 font-medium mt-1">إجمالي المناديب</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                            <div className="text-2xl font-black text-blue-700">
                                {repsData.reduce((s, r) => s + r.monthlySales, 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600 font-medium mt-1">إجمالي المبيعات ج.م</div>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                            <div className="text-2xl font-black text-purple-700">
                                {repsData.reduce((s, r) => s + r.monthlyCollections, 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-purple-600 font-medium mt-1">إجمالي التحصيل ج.م</div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                            <div className="text-2xl font-black text-red-700">
                                {repsData.reduce((s, r) => s + r.totalCustomerDebt, 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-red-600 font-medium mt-1">إجمالي الديون ج.م</div>
                        </div>
                    </div>

                    {/* Reps Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {repsData.map(rep => {
                            const progress = rep.salesTarget > 0
                                ? Math.min((rep.monthlySales / rep.salesTarget) * 100, 100)
                                : 0;
                            const progressColor = progress >= 100 ? 'bg-emerald-500' :
                                progress >= 60 ? 'bg-blue-500' :
                                progress >= 30 ? 'bg-amber-500' : 'bg-red-400';
                            const progressTextColor = progress >= 100 ? 'text-emerald-700' :
                                progress >= 60 ? 'text-blue-600' :
                                progress >= 30 ? 'text-amber-600' : 'text-red-500';

                            return (
                                <div key={rep.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden">
                                    {/* Card Header */}
                                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-black text-lg">
                                                {rep.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold">{rep.name}</div>
                                                <div className="text-emerald-200 text-xs">مندوب مبيعات</div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/dashboard/reps/${rep.id}`}
                                            className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                        >
                                            التفاصيل
                                        </Link>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 space-y-4">
                                        {/* Target Progress */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                    <Target className="w-3 h-3" /> نسبة إنجاز التارجت
                                                </span>
                                                <span className={`text-sm font-black ${progressTextColor}`}>{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${progressColor}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            {rep.salesTarget > 0 && (
                                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                                    <span>{rep.monthlySales.toLocaleString()} ج.م مُحقق</span>
                                                    <span>هدف: {rep.salesTarget.toLocaleString()} ج.م</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                                                <TrendingUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                                                <div className="text-xs font-black text-emerald-800">{rep.monthlySales.toLocaleString()}</div>
                                                <div className="text-[10px] text-emerald-600">مبيعات</div>
                                            </div>
                                            <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                                                <Banknote className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                                <div className="text-xs font-black text-blue-800">{rep.monthlyCollections.toLocaleString()}</div>
                                                <div className="text-[10px] text-blue-600">تحصيل</div>
                                            </div>
                                            <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                                                <Package className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                                <div className="text-xs font-black text-amber-800">{rep.inventoryCount.toLocaleString()}</div>
                                                <div className="text-[10px] text-amber-600">عهدة</div>
                                            </div>
                                        </div>

                                        {/* Debt */}
                                        {rep.totalCustomerDebt > 0 && (
                                            <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                                                <span className="text-xs text-red-600 font-medium">ديون العملاء</span>
                                                <span className="text-sm font-black text-red-700">{rep.totalCustomerDebt.toLocaleString()} ج.م</span>
                                            </div>
                                        )}
                                        {rep.totalCustomerDebt === 0 && (
                                            <div className="flex items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                                <span className="text-xs text-emerald-600 font-bold">✓ لا توجد ديون معلقة</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
