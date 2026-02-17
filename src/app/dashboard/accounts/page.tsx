import Link from "next/link";
import { getFinancialSummary } from "@/lib/actions/accounts";
import prisma from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, Zap, PieChart, Users, Building2 } from "lucide-react";
import { OverviewChart } from "@/components/charts/overview-chart";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

// Mock data
const chartData = [
    { name: "سبتمبر", sales: 45000, expenses: 12000, profit: 33000 },
    { name: "أكتوبر", sales: 52000, expenses: 14000, profit: 38000 },
    { name: "نوفمبر", sales: 48000, expenses: 11000, profit: 37000 },
    { name: "ديسمبر", sales: 61000, expenses: 18000, profit: 43000 },
    { name: "يناير", sales: 55000, expenses: 15000, profit: 40000 },
    { name: "فبراير", sales: 12000, expenses: 3000, profit: 9000 },
];

export default async function AccountsDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const summary = await getFinancialSummary(startOfMonth, endOfMonth);
    const agencies = await prisma.agency.findMany({ select: { id: true, name: true, image: true } });

    // Calculate total supplier balance
    const allTransactions = await prisma.transaction.findMany({
        where: { supplierId: { not: null } },
        select: { totalAmount: true, paidAmount: true }
    });
    const allSupplierAccounts = await prisma.accountRecord.findMany({
        where: { supplierId: { not: null } },
        select: { amount: true, type: true }
    });

    const totalSupplierDebt = allTransactions.reduce((acc: number, t: any) => acc + (Number(t.totalAmount) - Number(t.paidAmount || 0)), 0)
        - allSupplierAccounts.filter((a: any) => a.type === 'EXPENSE').reduce((acc: number, a: any) => acc + Number(a.amount), 0)
        + allSupplierAccounts.filter((a: any) => a.type === 'INCOME').reduce((acc: number, a: any) => acc + Number(a.amount), 0);

    const totalCustomerDebtAgg = await prisma.transaction.aggregate({
        where: { type: 'SALE' },
        _sum: { remainingAmount: true }
    });
    const totalCustomerDebt = Number(totalCustomerDebtAgg._sum.remainingAmount || 0);

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-rose-50/30 overflow-hidden">

            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-300/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-12 flex flex-col md:flex-row justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 pb-2">
                        لوحة القيادة المالية
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">
                        نظرة شاملة على أداء شهر <span className="text-indigo-600 font-bold underline decoration-wavy decoration-indigo-300 underline-offset-4">{now.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</span>
                    </p>
                </div>
                <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold text-slate-600 mt-4 md:mt-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    بيانات حية
                </div>
            </div>

            {/* Hero Section: The Big Numbers */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mb-10">

                {/* Treasury Card (Main Focus) */}
                <div className="lg:col-span-4 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl transform rotate-1 transition-transform group-hover:rotate-2 opacity-80 blur shadow-2xl"></div>
                    <div className="relative bg-slate-900 rounded-3xl p-8 h-full flex flex-col justify-between text-white shadow-2xl overflow-hidden border border-white/10">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
                                <Wallet className="w-8 h-8 text-indigo-300" />
                            </div>
                            <span className="text-xs font-bold tracking-widest uppercase text-indigo-300/80 bg-indigo-950/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                الخزينة (Cash)
                            </span>
                        </div>
                        <div className="mt-8">
                            <h2 className="text-4xl font-black tracking-tight mb-2 text-white drop-shadow-lg">
                                {formatMoney(summary.treasuryBalance)}
                            </h2>
                            <p className="text-indigo-200 text-sm font-medium flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4" />
                                الرصيد المتاح حالياً
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rep Debts Card (New Big Card) */}
                <div className="lg:col-span-4 relative group">
                    <Link href="/dashboard/accounts/rep-debts" className="block h-full group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl transform -rotate-1 transition-transform group-hover:-rotate-2 opacity-80 blur shadow-2xl"></div>
                        <div className="relative bg-emerald-900 rounded-3xl p-8 h-full flex flex-col justify-between text-white shadow-2xl overflow-hidden border border-white/10">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
                                    <DollarSign className="w-8 h-8 text-emerald-300" />
                                </div>
                                <span className="text-xs font-bold tracking-widest uppercase text-emerald-300/80 bg-emerald-950/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                    مديونيات المناديب والعملاء
                                </span>
                            </div>
                            <div className="mt-8">
                                <h2 className="text-4xl font-black tracking-tight mb-2 text-white drop-shadow-lg">
                                    {formatMoney(totalCustomerDebt)}
                                </h2>
                                <p className="text-emerald-200 text-sm font-medium flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4" />
                                    إدارة وتحصيل المديونيات
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Net Profit Card */}
                <div className="lg:col-span-4 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl transform rotate-1 transition-transform group-hover:rotate-2 opacity-60 blur shadow-xl"></div>
                    <div className="relative glass-card bg-white/90 rounded-3xl p-8 h-full flex flex-col justify-between shadow-xl border border-white/60">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-indigo-100 rounded-2xl">
                                <Activity className="w-8 h-8 text-indigo-600" />
                            </div>
                            <span className="text-xs font-bold uppercase text-indigo-700 bg-indigo-100/50 px-3 py-1 rounded-full">
                                صافي الربح (الشهر)
                            </span>
                        </div>
                        <div className="mt-6">
                            <div className="text-4xl font-black text-slate-800 tracking-tight">
                                {formatMoney(summary.netProfit)}
                            </div>
                            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 w-[70%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Sales */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:bg-white/90 transition-all border-l-4 border-l-blue-500 shadow-sm">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">إجمالي المبيعات</p>
                        <p className="text-2xl font-black text-blue-700">{formatMoney(summary.totalSales)}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                </div>

                {/* Expenses */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:bg-white/90 transition-all border-l-4 border-l-orange-500 shadow-sm">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">المصروفات</p>
                        <p className="text-2xl font-black text-orange-600">{formatMoney(summary.expenses)}</p>
                    </div>
                    <div className="h-10 w-10 bg-orange-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingDown className="w-5 h-5 text-orange-600" />
                    </div>
                </div>

                {/* Gross Profit */}
                <div className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:bg-white/90 transition-all border-l-4 border-l-purple-500 shadow-sm">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">إجمالي الربح (Gross)</p>
                        <p className="text-2xl font-black text-purple-700">{formatMoney(summary.grossProfit)}</p>
                    </div>
                    <div className="h-10 w-10 bg-purple-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5 text-purple-600" />
                    </div>
                </div>

                {/* Supplier Debt */}
                <Link href="/dashboard/suppliers" className="glass-card p-5 rounded-2xl flex items-center justify-between group hover:bg-white/90 transition-all border-l-4 border-l-rose-500 shadow-sm">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">مديونية الموردين</p>
                        <p className="text-2xl font-black text-rose-700">{formatMoney(totalSupplierDebt)}</p>
                    </div>
                    <div className="h-10 w-10 bg-rose-100/50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5 text-rose-600" />
                    </div>
                </Link>
            </div>

            {/* Agencies Section */}
            <div className="relative z-10 mt-12 mb-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">حسابات التوكيلات والموردين</h2>
                        <p className="text-slate-500 font-medium">اختر التوكيل لعرض حسابات الموردين التابعة له</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agencies.map((agency: any) => (
                        <Link key={agency.id} href={`/dashboard/accounts/agencies/${agency.id}`}
                            className="group relative bg-white rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-100 overflow-hidden hover:-translate-y-1">
                            {/* Decorative background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors" />

                            <div className="relative flex items-center gap-5">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 group-hover:border-indigo-200 transition-colors">
                                    {agency.image ? (
                                        <img src={agency.image} alt={agency.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{agency.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">عرض تفاصيل الحسابات</span>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Charts Section - Glass Style */}
            <div className="relative z-10">
                <div className="glass-card p-8 rounded-3xl shadow-lg border border-white/60">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">تحليل الأداء الزمني</h3>
                    </div>
                    <div className="h-[400px]">
                        <OverviewChart data={chartData} />
                    </div>
                </div>
            </div>

        </div>
    );
}
