import { getFinancialSummary, getAgencySuppliersBalances } from "@/lib/actions/accounts";
import { getAgencies } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, TrendingUp, TrendingDown, Zap, Wallet, Users, ArrowLeft, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AgencyAccountsPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const agencies = await getAgencies();
    const agency = agencies.find(a => a.id === id);

    if (!agency) {
        notFound();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const summary = await getFinancialSummary(startOfMonth, endOfMonth, id);
    const supplierBalances = await getAgencySuppliersBalances(id);

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/accounts" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors border border-slate-200">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            حسابات {agency.name}
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium">التقرير المالي وحسابات الموردين التابعة للتوكيل</p>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    {now.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-2xl">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">إجمالي المبيعات</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{formatMoney(summary.totalSales)}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 rounded-2xl">
                                <TrendingDown className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">المصروفات</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{formatMoney(summary.expenses)}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-2xl">
                                <Zap className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">إجمالي الربح</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{formatMoney(summary.grossProfit)}</h3>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl">
                                <Wallet className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">الخزينة (التوكيل)</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{formatMoney(summary.treasuryBalance)}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Suppliers Balances Section */}
            <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-500" />
                            حسابات الموردين (مديونيات)
                        </CardTitle>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {supplierBalances.length} موردين
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="text-right font-bold text-slate-900 py-4">اسم المورد</TableHead>
                                <TableHead className="text-right font-bold text-slate-900">رقم الهاتف</TableHead>
                                <TableHead className="text-left font-bold text-slate-900">الرصيد الحالي</TableHead>
                                <TableHead className="text-center font-bold text-slate-900">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {supplierBalances.map((supplier) => (
                                <TableRow key={supplier.id} className="hover:bg-slate-50/80 transition-colors">
                                    <TableCell className="font-bold text-slate-700 py-4">{supplier.name}</TableCell>
                                    <TableCell className="text-slate-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-slate-300" />
                                            {supplier.phone || 'غير مسجل'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-left">
                                        <span className={`text-xl font-black ${supplier.currentBalance > 0 ? 'text-rose-600' : supplier.currentBalance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {formatMoney(supplier.currentBalance)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Link href={`/dashboard/suppliers/${supplier.id}`} className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-black transition-all shadow-md active:scale-95">
                                            <ExternalLink className="w-3 h-3" />
                                            كشف حساب كامل
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {supplierBalances.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-bold border-none">
                                        لا يوجد موردين مسجلين لهذا التوكيل
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
