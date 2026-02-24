import { getSupplierDetails } from "@/lib/actions/suppliers";
import { getCurrentUser } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Phone, MapPin, Receipt, Wallet, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpeningBalanceModal } from "@/components/accounts/opening-balance-modal";
import SupplierLedgerTable from "./supplier-ledger-table";

export const dynamic = 'force-dynamic';

export default async function SupplierAccountPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supplier = await getSupplierDetails(id);
    const user = await getCurrentUser();

    if (!supplier) {
        notFound();
    }

    // Merge transactions and account records into a single ledger for the client component
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
            items: t.items.length,
            rawTransaction: t
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

    const currentBalance = ledger.reduce((acc, curr) => acc + curr.balance, 0);

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
                    <OpeningBalanceModal
                        type="SUPPLIER"
                        id={supplier.id}
                        name={supplier.name}
                        agencyId={supplier.agencyId}
                        visible={!supplier.hasInitialBalance}
                    />
                    <button className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <FileText className="w-5 h-5" />
                        طباعة الكشف
                    </button>
                    <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 flex flex-col items-center min-w-[180px]">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">الرصيد الحالي</span>
                        <span className="text-2xl">{formatMoney(currentBalance)}</span>
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
                            {formatMoney(currentBalance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content: Ledger Table */}
            <SupplierLedgerTable
                initialLedger={ledger}
                userRole={user.role}
                supplierName={supplier.name}
            />
        </div>
    );
}
