import { getAgencyPurchases, getAgencies } from "@/lib/actions";
import { Building2, TrendingUp, Wallet, AlertCircle, ArrowRight, Clock } from "lucide-react";
import AgencyPaymentForm from "../agency-payment-form";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AgencyPurchasesPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const allReports = await getAgencyPurchases();
    const agencyReport = allReports.find(a => a.id === id);

    if (!agencyReport) {
        notFound();
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumbs/Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <Link
                        href="/dashboard/accounts/reports/purchases"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"
                    >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        العودة لقائمة التوكيلات
                    </Link>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        مشتريات {agencyReport.name}
                    </h1>
                </div>

                <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-2xl">
                    <p className="text-red-700 text-[10px] font-bold mb-1 uppercase tracking-wider text-right">إجمالي المديونية الحالية</p>
                    <p className="text-2xl font-black text-red-600 text-right font-mono">
                        {agencyReport.totalRemaining.toLocaleString()} <span className="text-sm font-sans italic">ج.م</span>
                    </p>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-blue-600">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black">إجمالي حجم التوريدات</span>
                    </div>
                    <p className="text-3xl font-black text-gray-800 font-mono italic">
                        {agencyReport.totalPurchases.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-emerald-600">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black">إجمالي المبالغ المدفوعة</span>
                    </div>
                    <p className="text-3xl font-black text-gray-800 font-mono italic">
                        {agencyReport.totalPaid.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Settlement Section */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-8 rounded-[2rem] shadow-inner">
                <div className="max-w-xl mx-auto text-center space-y-4">
                    <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 mb-2">
                        <Wallet className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-black text-emerald-900">سداد مديونية للتوكيل</h2>
                    <p className="text-xs text-emerald-700 font-bold max-w-sm mx-auto">
                        يمكنك تسجيل مبلغ مسدد لهذا التوكيل وسيتم خصمه فوراً من مديونيتك الإجمالية لديه.
                    </p>
                    <div className="mt-6">
                        <AgencyPaymentForm agencyId={agencyReport.id} agencyName={agencyReport.name} />
                    </div>
                </div>
            </div>

            {/* Detailed Transaction History */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <h3 className="font-black text-gray-800">تاريخ الحركات المالية</h3>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        سجل {agencyReport.transactions.length} حركة
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-emerald-800/5 text-[10px] font-black text-emerald-900/60 uppercase border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">البيان / التاريخ</th>
                                <th className="px-6 py-5">المسؤول</th>
                                <th className="px-6 py-5">الأصناف</th>
                                <th className="px-6 py-5 text-center">القيمة</th>
                                <th className="px-6 py-5 text-center">المدفوع</th>
                                <th className="px-8 py-5 text-center text-red-600">المتبقي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {agencyReport.transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-blue-50/30 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-gray-900">
                                            {tx.type === 'SUPPLY_PAYMENT' ? (
                                                <span className="text-emerald-700 flex items-center gap-1">
                                                    <Wallet className="w-3 h-3" />
                                                    سداد مديونية (وصل)
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3 text-blue-400" />
                                                    فاتورة توريد #{tx.id.slice(0, 8)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold mt-1">
                                            {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        {tx.note && (
                                            <div className="text-[10px] text-blue-400 mt-2 bg-blue-50/50 px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate">
                                                📝 {tx.note}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black border border-blue-100">
                                                {tx.user.name.slice(0, 1)}
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">{tx.user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                            {tx.items.length > 0 ? tx.items.map((item, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-lg font-bold border border-gray-200 shadow-sm">
                                                    {item.product.name} <span className="text-blue-600 ml-1">×{item.quantity}</span>
                                                </span>
                                            )) : <span className="text-gray-400 italic text-[10px] font-bold">حركة مالية فقط</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-center font-mono">
                                        {tx.type === 'SUPPLY_PAYMENT' ? '---' : tx.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 font-black text-emerald-600 text-center font-mono">
                                        {tx.type === 'SUPPLY_PAYMENT' ? (
                                            <div className="flex flex-col items-center">
                                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs animate-pulse">
                                                    +{tx.paidAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        ) : (
                                            tx.paidAmount.toLocaleString()
                                        )}
                                    </td>
                                    <td className="px-8 py-5 font-black text-red-600 text-center font-mono italic">
                                        {tx.type === 'SUPPLY_PAYMENT' ? '---' : (
                                            tx.remainingAmount > 0 ? (
                                                <div className="flex flex-col items-center">
                                                    <span>{tx.remainingAmount.toLocaleString()}</span>
                                                    {tx.paymentType === 'CREDIT' && (
                                                        <span className="text-[8px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full mt-1 uppercase font-black">مديونية</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-emerald-500 font-sans text-xs">خالص ✅</span>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {agencyReport.transactions.length === 0 && (
                <div className="bg-white p-20 rounded-3xl border border-gray-100 shadow-sm text-center">
                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">لا توجد حركات مسجلة لهذا التوكيل حتى الآن</h3>
                    <p className="text-sm text-gray-300 mt-2 font-bold">ابدأ بتوريد بضاعة أو تسجيل سداد لهذا التوكيل</p>
                </div>
            )}
        </div>
    );
}

import { getPurchasesReport } from "@/lib/actions/reports";
import { FileText } from "lucide-react";
