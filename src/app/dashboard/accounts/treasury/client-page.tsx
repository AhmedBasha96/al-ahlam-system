'use client';

import { useState } from 'react';
import { getTreasuryTransactions, setInitialTreasuryBalance } from '@/lib/actions/accounts';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, ArrowUpRight, ArrowDownLeft, Receipt, ShoppingBag, Wallet, Filter, PlusCircle, Scale } from "lucide-react";

interface TreasuryPageProps {
    agencies: { id: string, name: string }[];
    initialTransactions: any[];
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
};

export default function ClientTreasuryPage({ agencies, initialTransactions }: TreasuryPageProps) {
    const [filter, setFilter] = useState("ALL");
    const [transactions, setTransactions] = useState(initialTransactions);
    const [loading, setLoading] = useState(false);

    const handleFilterChange = async (value: string) => {
        setFilter(value);
        setLoading(true);
        const agencyId = value === 'ALL' ? undefined : value;
        const data = await getTreasuryTransactions(agencyId);
        setTransactions(data);
        setLoading(false);
    };

    const [isInitialModalOpen, setIsInitialModalOpen] = useState(false);
    const [initialAmount, setInitialAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSetInitialBalance = async () => {
        if (!initialAmount || isNaN(Number(initialAmount))) {
            alert("يرجى إدخال مبلغ صحيح");
            return;
        }

        setIsSubmitting(true);
        try {
            const agencyId = filter === 'GENERAL' ? null : filter;
            await setInitialTreasuryBalance(agencyId, Number(initialAmount));

            // Refresh data
            const data = await getTreasuryTransactions(filter === 'ALL' ? undefined : filter);
            setTransactions(data);

            setIsInitialModalOpen(false);
            setInitialAmount("");
            alert("تم تعيين رصيد بداية المدة بنجاح");
        } catch (error) {
            alert("خطأ في تعيين الرصيد");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-50 overflow-hidden text-slate-800">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-200/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header & Filter */}
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-600 pb-2">
                        دفتر الخزينة
                    </h1>
                    <p className="text-slate-500 font-medium text-lg mt-1">
                        تتبع لحظي للسيولة النقدية وحركة الأموال
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="glass-card flex items-center gap-3 p-1.5 pr-4 rounded-full w-full lg:w-auto">
                        <Filter className="text-emerald-600 w-5 h-5" />
                        <Select value={filter} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-full lg:w-[280px] border-0 bg-transparent focus:ring-0 text-slate-700 font-semibold h-9">
                                <SelectValue placeholder="تصفية التوكيل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">إجمالي الخزينة (المجمع)</SelectItem>
                                <SelectItem value="GENERAL">الخزينة العامة (أخرى)</SelectItem>
                                {agencies.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Balance Card */}
            <div className="relative z-10 mb-8">
                <div className="relative group overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 transform transition-transform group-hover:scale-105 opacity-90"></div>
                    <div className="relative p-8 flex flex-col md:flex-row items-center justify-between text-white">

                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
                                <Landmark className="w-10 h-10 text-emerald-50" />
                            </div>
                            <div>
                                <p className="text-emerald-100 font-medium text-lg mb-1">الرصيد الحالي المتوفر</p>
                                <div className={`text-6xl font-black tracking-tight drop-shadow-sm ${loading ? 'opacity-50 blur-sm' : ''} transition-all`}>
                                    {loading ? '...' : formatMoney(currentBalance)}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            {filter !== 'ALL' && (
                                <button
                                    onClick={() => setIsInitialModalOpen(true)}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 transition-all text-sm font-bold group/btn"
                                >
                                    <Scale className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                    تعيين رصيد بداية المدة
                                </button>
                            )}
                            <div className="hidden md:block text-right">
                                <div className="text-sm font-medium text-emerald-100 bg-black/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
                                    {filter === 'ALL' ? 'الرصيد المجمع لجميع التوكيلات' :
                                        filter === 'GENERAL' ? 'الخزينة العامة (مصروفات أخرى)' :
                                            `خزينة: ${agencies.find(a => a.id === filter)?.name}`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Initial Balance Modal */}
            {isInitialModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-emerald-600 p-6 text-white text-center">
                            <Landmark className="w-12 h-12 mx-auto mb-4 opacity-80" />
                            <h3 className="text-2xl font-black">تعيين رصيد البداية</h3>
                            <p className="text-emerald-100 font-medium mt-1">
                                {filter === 'GENERAL' ? 'للخزينة العامة' : `لتوكيل: ${agencies.find(a => a.id === filter)?.name}`}
                            </p>
                        </div>
                        <div className="p-8">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700">المبلغ الإفتتاحي</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={initialAmount}
                                        onChange={(e) => setInitialAmount(e.target.value)}
                                        className="w-full text-3xl font-black text-center border-2 border-slate-100 rounded-2xl p-4 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-200"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">EGP</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    * سيتم تسجيل هذا المبلغ كرصيد بداية المدة لهذه الخزينة. إذا كان هناك رصيد مسجل مسبقاً، سيتم تحديثه.
                                </p>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={handleSetInitialBalance}
                                    disabled={isSubmitting || !initialAmount}
                                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                                </button>
                                <button
                                    onClick={() => setIsInitialModalOpen(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <div className="relative z-10">
                <div className="glass-card rounded-3xl overflow-hidden border border-white/60 shadow-xl">
                    <div className="p-6 bg-white/40 border-b border-white/50 backdrop-blur-md sticky top-0 z-20">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-slate-500" />
                            سجل الحركة التفصيلي
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[180px] text-slate-500 font-bold">التاريخ</TableHead>
                                    <TableHead className="w-[120px] text-slate-500 font-bold">النوع</TableHead>
                                    <TableHead className="text-slate-500 font-bold">البيان / التوكيل</TableHead>
                                    <TableHead className="text-left pl-8 text-emerald-600 font-bold">وارد (+)</TableHead>
                                    <TableHead className="text-left pl-8 text-rose-600 font-bold">صادر (-)</TableHead>
                                    <TableHead className="text-left pl-8 text-slate-700 font-bold bg-slate-100/30">الرصيد</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">جاري تحديث البيانات...</TableCell>
                                    </TableRow>
                                ) : transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShoppingBag className="w-8 h-8 opacity-20" />
                                                لا توجد حركات مسجلة
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((tx) => (
                                        <TableRow key={`${tx.type}-${tx.id}`} className="group hover:bg-emerald-50/30 transition-colors border-b-slate-100">
                                            <TableCell className="font-medium text-slate-500 font-mono text-xs py-4">
                                                {new Date(tx.date).toLocaleString('ar-EG', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <BadgeType type={tx.type} />
                                            </TableCell>
                                            <TableCell className="py-4 text-slate-700">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{tx.description}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        {tx.agencyName || 'عام'}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-left pl-8 font-mono font-bold text-emerald-600 text-sm py-4">
                                                {tx.amount > 0 ? formatMoney(tx.amount) : ''}
                                            </TableCell>

                                            <TableCell className="text-left pl-8 font-mono font-bold text-rose-500 text-sm py-4">
                                                {tx.amount < 0 ? formatMoney(Math.abs(tx.amount)) : ''}
                                            </TableCell>

                                            <TableCell className={`text-left pl-8 font-mono font-bold text-sm py-4 bg-slate-50/30 ${tx.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                                {formatMoney(tx.balance)}
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

function BadgeType({ type }: { type: string }) {
    switch (type) {
        case 'SALE':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/50 text-emerald-700 text-xs font-bold ring-1 ring-emerald-200">
                    <ArrowDownLeft className="w-3 h-3" /> مبيعات
                </span>
            );
        case 'INCOME':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-xs font-bold ring-1 ring-blue-200">
                    <Wallet className="w-3 h-3" /> إيراد
                </span>
            );
        case 'PURCHASE':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/50 text-rose-700 text-xs font-bold ring-1 ring-rose-200">
                    <ArrowUpRight className="w-3 h-3" /> شراء
                </span>
            );
        case 'EXPENSE':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/50 text-orange-700 text-xs font-bold ring-1 ring-orange-200">
                    <Receipt className="w-3 h-3" /> مصروف
                </span>
            );
        default:
            return <span>{type}</span>;
    }
}
