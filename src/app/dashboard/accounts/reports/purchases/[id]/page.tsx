import { getAgencyPurchases, getCurrentUser } from "@/lib/actions";
import { Building2, TrendingUp, Wallet, AlertCircle, ArrowRight, Clock, FileText } from "lucide-react";
import AgencyPaymentForm from "../agency-payment-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import PurchaseHistoryTable from "./purchase-history-table";

export const dynamic = 'force-dynamic';

export default async function AgencyPurchasesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const allReports = await getAgencyPurchases();
    const agencyReport = allReports.find(a => a.id === id);
    const user = await getCurrentUser();

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
            <PurchaseHistoryTable
                transactions={agencyReport.transactions as any}
                userRole={user.role}
                agencyName={agencyReport.name}
            />

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
