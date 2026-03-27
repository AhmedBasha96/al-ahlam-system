'use client';

import { AccountantDashboardStats } from '@/lib/actions/dashboard';
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Clock, FileText, Landmark } from 'lucide-react';
import Link from 'next/link';

interface AccountantDashboardProps {
    stats: AccountantDashboardStats;
    userName: string;
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

export default function AccountantDashboard({ stats, userName }: AccountantDashboardProps) {
    const { treasuryBalance, todayCashIn, todayCashOut, pendingReturnApprovalsCount, recentTransactions } = stats;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black text-slate-800">مرحباً، {userName} 👋</h1>
            <p className="text-slate-500 font-medium pb-4 border-b">لوحة التحكم الخاصة بالحسابات والماليات</p>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-slate-900/20 border-0 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-110 transition-transform">
                            <Landmark className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <Landmark className="w-6 h-6 text-emerald-300" />
                            </div>
                            <h3 className="text-slate-200 font-bold">إجمالي الخزينة</h3>
                        </div>
                        <p className="text-3xl font-black tracking-tighter drop-shadow-md">
                            {formatMoney(treasuryBalance)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-0 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <ArrowDownLeft className="w-6 h-6 text-emerald-100" />
                            </div>
                            <h3 className="text-emerald-50 font-bold">مقبوضات اليوم</h3>
                        </div>
                        <p className="text-3xl font-black tracking-tighter drop-shadow-md">
                            {formatMoney(todayCashIn)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-xl shadow-rose-500/20 border-0 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-24 h-24" />
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                <ArrowUpRight className="w-6 h-6 text-rose-100" />
                            </div>
                            <h3 className="text-rose-50 font-bold">مدفوعات اليوم</h3>
                        </div>
                        <p className="text-3xl font-black tracking-tighter drop-shadow-md">
                            {formatMoney(todayCashOut)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-orange-500/20 border-0 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:-rotate-12 transition-transform">
                            <Clock className="w-24 h-24" />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <FileText className="w-6 h-6 text-amber-50" />
                                </div>
                                <h3 className="text-amber-50 font-bold">مهام قيد الإنتظار</h3>
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <p className="text-4xl font-black tracking-tighter drop-shadow-md">
                                {pendingReturnApprovalsCount}
                            </p>
                            <Link href="/dashboard/accounts/approvals" className="text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors backdrop-blur-md">
                                مراجعة
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Finances Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        أحدث حركات اليوم
                    </h2>
                    <Link href="/dashboard/accounts/treasury" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">
                        عرض دفتر الخزينة
                    </Link>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                            <tr>
                                <th className="px-6 py-4 font-bold rounded-tr-3xl">التاريخ</th>
                                <th className="px-6 py-4 font-bold">النوع</th>
                                <th className="px-6 py-4 font-bold">البيان</th>
                                <th className="px-6 py-4 font-bold text-emerald-600">وارد (+)</th>
                                <th className="px-6 py-4 font-bold text-rose-600 rounded-tl-3xl">صادر (-)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.map((tx: any) => (
                                <tr key={tx.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-500">
                                        {new Date(tx.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                                            tx.type === 'DEBIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {tx.referenceType === 'SALE' ? 'مبيعات' :
                                             tx.referenceType === 'PURCHASE' ? 'مشتريات' :
                                             tx.referenceType === 'EXPENSE' ? 'مصروف' :
                                             tx.referenceType === 'COLLECTION' ? 'تحصيل' :
                                             tx.type === 'DEBIT' ? 'إيراد' : 'صادر'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {tx.description}
                                        {tx.agencyName && <span className="text-[10px] text-slate-400 block mt-1">{tx.agencyName}</span>}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600 font-mono">
                                        {tx.type === 'DEBIT' ? formatMoney(tx.amount) : ''}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-rose-600 font-mono">
                                        {tx.type === 'CREDIT' ? formatMoney(tx.amount) : ''}
                                    </td>
                                </tr>
                            ))}
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        لا توجد حركات مسجلة حالياً
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
