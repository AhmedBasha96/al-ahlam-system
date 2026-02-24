'use client';

import { useState } from 'react';
import { createAccountRecord } from "@/lib/actions/accounts";
import { updateAccountRecord } from "@/lib/actions/accounts";
import TransactionModal from "@/components/shared/transaction-modal";
import AccountRecordEditModal from "@/components/shared/account-record-edit-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, Calendar, Tag, Building2, Wallet, PieChart } from "lucide-react";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";

interface IncomePageProps {
    initialIncome: any[];
    agencies: { id: string, name: string }[];
    suppliers: { id: string, name: string, agencyId: string }[];
    userRole?: string;
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientIncomePage({ initialIncome, agencies, suppliers, userRole }: IncomePageProps) {
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>("GENERAL");
    const [viewingRecord, setViewingRecord] = useState<any | null>(null);
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const filteredSuppliers = suppliers.filter(s => s.agencyId === selectedAgencyId);
    const totalIncome = initialIncome.reduce((sum, item) => sum + Number(item.amount), 0);
    const categoryDataMap = new Map<string, number>();
    initialIncome.forEach(inc => {
        const cat = inc.category || "غير مصنف";
        const val = Number(inc.amount);
        categoryDataMap.set(cat, (categoryDataMap.get(cat) || 0) + val);
    });
    const chartData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({ name, value }));

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-50 overflow-hidden text-slate-800">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-200/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-600 pb-2">
                        الإيرادات المتنوعة
                    </h1>
                    <p className="text-slate-500 font-medium ml-1">
                        تسجيل مصادر الدخل الإضافية والخدمات
                    </p>
                </div>

                {/* Fixed: Removed 'glass-card', used gradient bg */}
                <div className="px-8 py-4 rounded-3xl flex items-center gap-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xl shadow-emerald-500/30 transform hover:scale-105 transition-transform cursor-default">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/10">
                        <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-emerald-100 text-xs font-bold uppercase mb-0.5 opacity-90">إجمالي الدخل</p>
                        <div className="text-4xl font-black tracking-tight drop-shadow-md">{formatMoney(totalIncome)}</div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-3">
                {/* Left Column: Form & Chart */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Add New Income Form */}
                    <div className="glass-card p-6 rounded-3xl shadow-xl border border-white/60 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><ArrowUpRight className="h-4 w-4" /></span>
                            تسجيل إيراد جديد
                        </h3>

                        <form action={createAccountRecord} className="space-y-5">
                            <input type="hidden" name="type" value="INCOME" />

                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs font-bold text-slate-500 uppercase">قيمة المبلغ</Label>
                                <div className="relative">
                                    <Input id="amount" name="amount" type="number" step="0.01" className="pl-8 font-mono text-xl bg-emerald-50/50 border-emerald-200 focus:ring-emerald-500 focus:border-emerald-500 h-10 focus:bg-white transition-all" placeholder="0.00" required />
                                    <span className="absolute left-3 top-2 text-emerald-400 text-sm font-bold">EGP</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase">بيان الإيراد</Label>
                                <Input id="description" name="description" className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all" placeholder="مثال: بيع مخلفات" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase">التصنيف</Label>
                                    <Input id="category" name="category" className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all" placeholder="خدمات، متنوع..." />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="agencyId" className="text-xs font-bold text-slate-500 uppercase">الجهة (التوكيل)</Label>
                                    <Select name="agencyId" value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                                        <SelectTrigger className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all">
                                            <SelectValue placeholder="اختر التوكيل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GENERAL">إيراد عام</SelectItem>
                                            {agencies.map(agency => (
                                                <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplierId" className="text-xs font-bold text-slate-500 uppercase">المورد</Label>
                                <Select name="supplierId" disabled={selectedAgencyId === 'GENERAL'}>
                                    <SelectTrigger className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all">
                                        <SelectValue placeholder={selectedAgencyId === 'GENERAL' ? "اختر التوكيل أولاً" : "اختر المورد (اختياري)"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">بدون مورد</SelectItem>
                                        {filteredSuppliers.map(supplier => (
                                            <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date" className="text-xs font-bold text-slate-500 uppercase">التاريخ</Label>
                                <Input id="date" name="date" type="date" className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>

                            <Button type="submit" className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg shadow-slate-900/20 py-5 rounded-xl font-bold text-base transition-all active:scale-95">
                                حفـظ العملية
                            </Button>
                        </form>
                    </div>

                    {/* Chart Section */}
                    {chartData.length > 0 && (
                        <div className="glass-card p-6 rounded-3xl shadow-lg border border-white/60">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="p-2 bg-teal-100 text-teal-600 rounded-lg"><PieChart className="h-4 w-4" /></span>
                                <h3 className="text-lg font-bold text-slate-800">مصادر الدخل</h3>
                            </div>
                            <div className="h-[250px]">
                                <CategoryPieChart data={chartData} title="" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: History Table */}
                <div className="lg:col-span-2 h-full">
                    <div className="glass-card rounded-3xl shadow-xl border border-white/60 h-full flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800">سجل عمليات القبض</h3>
                            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                                {initialIncome.length} عملية
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[120px] font-bold text-slate-500/80">التاريخ</TableHead>
                                        <TableHead className="font-bold text-slate-500/80">البيان</TableHead>
                                        <TableHead className="font-bold text-slate-500/80">التصنيف</TableHead>
                                        <TableHead className="text-left pl-6 font-bold text-emerald-600/80">القيمة</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialIncome.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                لا يوجد بيانات لعرضها
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        initialIncome.map((income) => (
                                            <TableRow key={income.id} className="group hover:bg-emerald-50/40 transition-colors border-0 border-b border-slate-50">
                                                <TableCell className="font-medium text-slate-500 text-xs font-mono py-4">
                                                    {new Date(income.createdAt).toLocaleDateString('ar-EG')}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-sm">{income.description}</span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Building2 className="w-3 h-3" />
                                                            {income.agency?.name || 'إيراد عام'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {income.category ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                                                            <Tag className="w-3 h-3 text-slate-400" />
                                                            {income.category}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-left pl-6 font-black text-emerald-600 font-mono text-base py-4">
                                                    {formatMoney(Number(income.amount))}
                                                </TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => setViewingRecord(income)}
                                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition shadow-sm"
                                                        >
                                                            عرض 📄
                                                        </button>
                                                        {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY') && (
                                                            <button
                                                                onClick={() => setEditingRecord(income)}
                                                                className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition shadow-sm"
                                                            >
                                                                تعديل ✏️
                                                            </button>
                                                        )}
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
            {/* View Modal */}
            {viewingRecord && (
                <TransactionModal
                    id={viewingRecord.id}
                    partyName={viewingRecord.customer?.name || viewingRecord.supplier?.name || "مصدر خارجي"}
                    userName={viewingRecord.user?.name || "النظام"}
                    items={[]}
                    paymentInfo={{
                        type: 'CASH',
                        paidAmount: Number(viewingRecord.amount),
                        totalAmount: Number(viewingRecord.amount)
                    }}
                    date={viewingRecord.createdAt}
                    onClose={() => setViewingRecord(null)}
                    type="INCOME"
                />
            )}

            {/* Edit Modal */}
            {editingRecord && (
                <AccountRecordEditModal
                    id={editingRecord.id}
                    amount={Number(editingRecord.amount)}
                    description={editingRecord.description}
                    category={editingRecord.category}
                    date={editingRecord.createdAt}
                    type="INCOME"
                    agencyName={editingRecord.agency?.name}
                    onUpdate={updateAccountRecord}
                    onClose={() => {
                        setEditingRecord(null);
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
