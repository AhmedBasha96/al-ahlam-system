import { getPurchaseInvoices } from "@/lib/actions/accounts";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Package, Calendar, Warehouse, FileText, CheckCircle, Clock } from "lucide-react";

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

export default async function PurchasesPage() {
    const purchases = await getPurchaseInvoices();

    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalPending = purchases.reduce((sum, p) => sum + Number(p.remainingAmount), 0);
    const fullyPaid = purchases.filter(p => Number(p.remainingAmount) <= 0).length;

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 overflow-hidden text-slate-800">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-800 pb-2">
                        فواتير المشتريات
                    </h1>
                    <p className="text-slate-500 font-medium ml-1">
                        إرشيف التوريدات والمدفوعات الآجلة
                    </p>
                </div>

                <Link href="/dashboard/accounts/purchases/new">
                    <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20 px-8 py-6 rounded-2xl font-bold text-lg transition-all hover:-translate-y-1">
                        <Plus className="ml-2 h-5 w-5" />
                        فاتورة جديدة
                    </Button>
                </Link>
            </div>

            {/* KPIs */}
            <div className="relative z-10 grid gap-6 md:grid-cols-3 mb-8">
                <div className="glass-card p-6 rounded-3xl shadow-lg border-l-4 border-l-slate-800 flex items-center justify-between group hover:translate-y-1 transition-transform">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">إجمالي المشتريات</p>
                        <div className="text-3xl font-black text-slate-800">{formatMoney(totalPurchases)}</div>
                    </div>
                    <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-600" />
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl shadow-lg border-l-4 border-l-amber-500 flex items-center justify-between group hover:translate-y-1 transition-transform">
                    <div>
                        <p className="text-amber-500 text-xs font-bold uppercase mb-1">مبالغ مستحقة (آجل)</p>
                        <div className="text-3xl font-black text-amber-600">{formatMoney(totalPending)}</div>
                    </div>
                    <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                </div>

                <div className="glass-card p-6 rounded-3xl shadow-lg border-l-4 border-l-emerald-500 flex items-center justify-between group hover:translate-y-1 transition-transform">
                    <div>
                        <p className="text-emerald-500 text-xs font-bold uppercase mb-1">فواتير مدفوعة</p>
                        <div className="text-3xl font-black text-emerald-600">{fullyPaid} / {purchases.length}</div>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>
            </div>


            {/* Table */}
            <div className="relative z-10">
                <div className="glass-card rounded-3xl shadow-xl border border-white/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-xl font-bold text-slate-800">سجل الفواتير وارشيف التوريد</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[150px] font-bold text-slate-500">التاريخ</TableHead>
                                    <TableHead className="font-bold text-slate-500">مخزن الاستلام</TableHead>
                                    <TableHead className="font-bold text-slate-500">ملاحظات والتفاصيل</TableHead>
                                    <TableHead className="text-right font-bold text-indigo-600/80">القيمة الإجمالية</TableHead>
                                    <TableHead className="text-center font-bold text-slate-500">حالة السداد</TableHead>
                                    <TableHead className="text-right font-bold text-slate-500">أصناف الفاتورة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <FileText className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-lg font-medium text-slate-400">لا يوجد أي فواتير مسجلة</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    purchases.map((tx) => (
                                        <TableRow key={tx.id} className="group hover:bg-white/50 transition-colors border-0 border-b border-slate-50">
                                            <TableCell className="font-medium text-slate-600 font-mono text-xs py-5">
                                                {new Date(tx.createdAt).toLocaleDateString('ar-EG')}
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <Warehouse className="w-4 h-4 text-slate-400" />
                                                    <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold text-slate-600 shadow-sm">
                                                        {tx.warehouse?.name || 'مخزن افتراضي'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-slate-500 py-5 font-medium">{tx.note || '-'}</TableCell>
                                            <TableCell className="text-right font-black text-indigo-900 font-mono text-base py-5">{formatMoney(Number(tx.totalAmount))}</TableCell>
                                            <TableCell className="text-center py-5">
                                                {Number(tx.remainingAmount) > 0 ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 shadow-sm">
                                                        متبقي {formatMoney(Number(tx.remainingAmount))}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 shadow-sm">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        خالص الثمن
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right py-5 pr-8">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border-2 border-white shadow-sm ml-auto">
                                                    {tx.items.length}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
