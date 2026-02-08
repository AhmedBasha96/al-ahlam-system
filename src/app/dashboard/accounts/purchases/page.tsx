import { getPurchaseInvoices } from "@/lib/actions/accounts";
import { getAgencyPurchases } from "@/lib/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Plus, Package, Calendar, Warehouse, FileText,
    CheckCircle, Clock, Building2, TrendingUp,
    Wallet, ArrowLeft, ArrowRight, LayoutGrid
} from "lucide-react";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

export default async function PurchasesPage() {
    // We fetch agency-focused data which now includes all TRANSACTION history (PURCHASE + PAYMENT)
    const reportData = await getAgencyPurchases();
    const totalOwed = reportData.reduce((sum, agency) => sum + agency.totalRemaining, 0);

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 overflow-hidden text-slate-800">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-800 pb-2">
                        إدارة المشتريات والوكلاء
                    </h1>
                    <p className="text-slate-500 font-medium ml-1">
                        متابعة فواتير التوريد، المديونيات، وسداد المستحقات للتوكيلات
                    </p>
                </div>

                <Link href="/dashboard/accounts/purchases/new">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 px-8 py-6 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1">
                        <Plus className="ml-2 h-5 w-5" />
                        تسجيل فاتورة توريد جديدة
                    </Button>
                </Link>
            </div>

            {/* Global Summary Stats */}
            <div className="relative z-10 grid gap-6 md:grid-cols-4 mb-12">
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/60 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1">إجمالي المديونية الحالية</p>
                        <div className="text-2xl font-black text-red-600 font-mono">{formatMoney(totalOwed)}</div>
                    </div>
                    <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-red-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/60 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1">إجمالي التوريدات</p>
                        <div className="text-2xl font-black text-slate-800 font-mono">
                            {formatMoney(reportData.reduce((sum, a) => sum + a.totalPurchases, 0))}
                        </div>
                    </div>
                    <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/60 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1">المبالغ المسددة</p>
                        <div className="text-2xl font-black text-emerald-600 font-mono">
                            {formatMoney(reportData.reduce((sum, a) => sum + a.totalPaid, 0))}
                        </div>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-lg border border-white/60 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase mb-1">عدد التوكيلات</p>
                        <div className="text-2xl font-black text-slate-800">{reportData.length}</div>
                    </div>
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-600" />
                    </div>
                </div>
            </div>

            <div className="relative z-10 space-y-4 mb-8">
                <div className="flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-black text-slate-800">سجلات المشتريات مجمعة حسب التوكيل</h2>
                </div>
                <p className="text-xs text-slate-500 font-bold">اختر التوكيل لعرض كشف حساب تفصيلي وتسجيل عمليات السداد</p>
            </div>

            {/* Agency Selection Hub - The main request */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportData.map((agency) => (
                    <Link
                        key={agency.id}
                        href={`/dashboard/accounts/reports/purchases/${agency.id}`}
                        className="group relative bg-white p-6 rounded-[2.5rem] border border-white/60 shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden border-b-4 border-b-slate-100"
                    >
                        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-indigo-50 p-4 rounded-3xl shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className={`text-right ${agency.totalRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'} font-black text-[10px] uppercase tracking-wider`}>
                                    {agency.totalRemaining > 0 ? (
                                        <span className="bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 shadow-sm">مديونية قائمة</span>
                                    ) : (
                                        <span className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm text-emerald-600">الحساب خالص ✅</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors duration-500">{agency.name}</h2>
                            <p className="text-[10px] text-slate-400 font-black mb-8 italic opacity-0 group-hover:opacity-100 transition-opacity">كشف حساب، مديونيات، وفواتير التوريد...</p>

                            <div className="mt-auto space-y-3 pt-6 border-t border-slate-50">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المتبقي علينا كمديونية</span>
                                    <span className={`text-xl font-black ${agency.totalRemaining > 0 ? 'text-rose-600' : 'text-slate-300'} font-mono`}>
                                        {formatMoney(agency.totalRemaining)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline opacity-50 text-[10px]">
                                    <span className="font-black text-slate-400">إجمالي المشتريات</span>
                                    <span className="font-black text-slate-600 font-mono">
                                        {formatMoney(agency.totalPurchases)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 py-4 bg-slate-50 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all duration-500 shadow-sm">
                                عرض فواتير التوكيل والسداد
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                ))}

                {reportData.length === 0 && (
                    <div className="col-span-full bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 shadow-inner text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-300">لا توجد سجلات مشتريات حالياً</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
