import { getAgencyPurchases } from "@/lib/actions";
import { Building2, TrendingUp, Wallet, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PurchasesReportPage() {
    const reportData = await getAgencyPurchases();
    // Serialize Dates and Decimals
    const serializedReportData = JSON.parse(JSON.stringify(reportData));

    const totalOwed = serializedReportData.reduce((sum: any, agency: any) => sum + agency.totalRemaining, 0);

    return (
        <div className="space-y-8 pb-12">
            {/* Header with Global Summary */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight">تقارير مشتريات التوكيلات</h1>
                        <p className="text-sm text-gray-500 font-bold mt-2">اختر التوكيل لعرض فواتيره وتسجيل السدادات الخاصة به</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 px-8 py-4 rounded-3xl shadow-lg shadow-red-200 text-white min-w-[200px]">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">إجمالي المديونية للموردين</p>
                            <p className="text-3xl font-black font-mono tracking-tighter">
                                {totalOwed.toLocaleString()} <span className="text-sm font-sans">ج.م</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sub-stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">إجمالي المشتريات</span>
                        </div>
                        <p className="text-xl font-black text-gray-700">{serializedReportData.reduce((sum: any, a: any) => sum + a.totalPurchases, 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Wallet className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">إجمالي المدفوع</span>
                        </div>
                        <p className="text-xl font-black text-gray-700">{serializedReportData.reduce((sum: any, a: any) => sum + a.totalPaid, 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">عدد الموردين</p>
                        <p className="text-xl font-black text-gray-700">{serializedReportData.length}</p>
                    </div>
                </div>
            </div>

            {/* Agencies Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serializedReportData.map((agency: any) => (
                    <Link
                        key={agency.id}
                        href={`/dashboard/accounts/reports/purchases/${agency.id}`}
                        className="group relative bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-blue-50 p-4 rounded-2xl shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className={`text-right ${agency.totalRemaining > 0 ? 'text-red-600' : 'text-emerald-600'} font-black text-xs`}>
                                    {agency.totalRemaining > 0 ? (
                                        <span className="bg-red-50 px-3 py-1 rounded-full border border-red-100">باقي مديونية</span>
                                    ) : (
                                        <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">خالص ✅</span>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-500">{agency.name}</h2>
                            <p className="text-xs text-gray-400 font-bold mb-8 italic">عرض كافة فواتير التوريد والسدادات الخاصة بهذا التوكيل</p>

                            <div className="mt-auto space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المتبقي علينا</span>
                                    <span className={`text-xl font-black ${agency.totalRemaining > 0 ? 'text-red-600' : 'text-gray-400'} font-mono`}>
                                        {agency.totalRemaining.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline opacity-60">
                                    <span className="text-[10px] font-black text-gray-400">إجمالي التوريدات</span>
                                    <span className="text-sm font-black text-gray-600 font-mono">
                                        {agency.totalPurchases.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button className="flex items-center justify-center gap-2 mt-8 w-full py-4 bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white rounded-2xl font-black text-xs transition-all duration-500">
                                دخول الحساب
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </Link>
                ))}

                {serializedReportData.length === 0 && (
                    <div className="col-span-full bg-white p-20 rounded-3xl border border-gray-100 shadow-sm text-center">
                        <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">لا توجد توكيلات مسجلة لديها فواتير مشتريات</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
