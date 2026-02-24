import { getSupplierDetails } from "@/lib/actions/suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Building2, Phone, MapPin, Receipt, Wallet, ArrowUpRight, ArrowDownLeft, Calendar, FileText, Landmark } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningBalanceModal } from "@/components/accounts/opening-balance-modal";

export const dynamic = 'force-dynamic';

export default async function SupplierAccountPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supplier = await getSupplierDetails(id);

    if (!supplier) {
        notFound();
    }

    // Merge transactions and account records into a single ledger
    const ledger = [
        ...supplier.transactions.map((t: any) => ({
            id: t.id,
            date: t.createdAt,
            type: 'TRANSACTION',
            action: t.type === 'PURCHASE' ? 'شراء بضاعة' : 'مرتجع',
            amount: Number(t.totalAmount),
            paid: Number(t.paidAmount || 0),
            balance: Number(t.totalAmount) - Number(t.paidAmount || 0),
            note: t.note || (t.type === 'PURCHASE' ? 'فاتورة مشتريات' : 'مرتجع مشتريات'),
            items: t.items.length
        })),
        ...supplier.accounts.map((acc: any) => ({
            id: acc.id,
            date: acc.createdAt,
            type: 'ACCOUNT',
            action: acc.type === 'EXPENSE' ? 'دفعة للمورد' : 'إيراد من المورد',
            amount: 0,
            paid: Number(acc.amount),
            balance: acc.type === 'EXPENSE' ? -Number(acc.amount) : Number(acc.amount),
            note: acc.description,
            items: null
        }))
    ];

    // Sort by date ascending to calculate running balance
    ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const ledgerWithBalance = ledger.map(item => {
        // For a supplier, a PURCHASE increases what we owe them (positive balance/debt)
        // A PAYMENT (EXPENSE) decreases what we owe them (negative adjustment)
        // If type is TRANSACTION (PURCHASE), we owe the remainingAmount
        // If type is ACCOUNT (EXPENSE - Payment), we reduce the debt

        // Actually, let's keep it simple: 
        // Debt increases with TRANSACTION balance
        // Debt decreases with ACCOUNT payment (EXPENSE from our side)

        runningBalance += item.balance;
        return { ...item, runningBalance };
    });

    // Reverse for display (newest first)
    const displayLedger = [...ledgerWithBalance].reverse();

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    return (
        <div className="space-y-8 p-6 bg-slate-50 min-h-screen" dir="rtl">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/suppliers" className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200">
                        <ArrowLeft className="w-6 h-6 text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">كشف حساب: {supplier.name}</h1>
                        <div className="flex items-center gap-2 text-slate-500 font-medium mt-1">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span>{supplier.agency.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <OpeningBalanceModal type="SUPPLIER" id={supplier.id} name={supplier.name} agencyId={supplier.agencyId} />
                    <button className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <FileText className="w-5 h-5" />
                        طباعة الكشف
                    </button>
                    <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 flex flex-col items-center min-w-[180px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">الرصيد الحالي</span>
                        <span className="text-2xl">{formatMoney(runningBalance)}</span>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all">
                    <div className="h-1 bg-blue-500"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                <Receipt className="w-6 h-6 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">إجمالي المشتريات</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                            {formatMoney(ledger.filter(i => i.type === 'TRANSACTION').reduce((s, i) => s + i.amount, 0))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all">
                    <div className="h-1 bg-emerald-500"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                <Wallet className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">إجمالي المدفوعات</span>
                        </div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">
                            {formatMoney(ledger.reduce((s, i) => s + i.paid, 0))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md rounded-3xl overflow-hidden bg-white group hover:shadow-xl transition-all">
                    <div className="h-1 bg-orange-500"></div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                                <Building2 className="w-6 h-6 text-orange-600 group-hover:text-white" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">الرصيد المتبقي</span>
                        </div>
                        <div className="text-3xl font-black text-orange-600 tracking-tight">
                            {formatMoney(runningBalance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content: Ledger Table */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        حركة الحساب التفصيلية
                    </h2>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                        <Calendar className="w-4 h-4" />
                        جميع الحركات
                    </div>
                </div>
                <div className="bg-slate-50/30">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="text-center font-bold text-slate-400 py-6">التاريخ</TableHead>
                                <TableHead className="text-right font-bold text-slate-400 py-6">النوع / البيان</TableHead>
                                <TableHead className="text-center font-bold text-slate-400 py-6">قيمة الفاتورة</TableHead>
                                <TableHead className="text-center font-bold text-slate-400 py-6">المبلغ المدفوع</TableHead>
                                <TableHead className="text-left font-bold text-slate-800 py-6 px-8">الرصيد المستحق</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayLedger.map((item, idx) => (
                                <TableRow key={item.id} className="group hover:bg-white transition-all border-slate-50">
                                    <TableCell className="text-center py-6">
                                        <span className="text-xs font-black text-slate-400 font-mono">
                                            {new Date(item.date).toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'TRANSACTION' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                {item.type === 'TRANSACTION' ? <Receipt className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{item.action}</div>
                                                <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{item.note}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-slate-600 py-6">
                                        {item.amount > 0 ? formatMoney(item.amount) : '-'}
                                        {item.items && <span className="text-[10px] block text-slate-400">{item.items} صنف</span>}
                                    </TableCell>
                                    <TableCell className="text-center font-bold text-emerald-600 py-6">
                                        {item.paid > 0 ? formatMoney(item.paid) : '-'}
                                    </TableCell>
                                    <TableCell className="text-left py-6 px-8">
                                        <span className={`text-lg font-black font-mono ${item.runningBalance > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
                                            {formatMoney(item.runningBalance)}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
