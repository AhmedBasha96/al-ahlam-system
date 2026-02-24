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
import { ArrowDownLeft, Calendar, Tag, Building2, TrendingDown, Receipt, PieChart } from "lucide-react";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";

interface ExpensesPageProps {
    initialExpenses: any[];
    agencies: { id: string, name: string }[];
    suppliers: { id: string, name: string, agencyId: string }[];
    userRole?: string;
}

const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export default function ClientExpensesPage({ initialExpenses, agencies, suppliers, userRole }: ExpensesPageProps) {
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>("GENERAL");
    const [viewingRecord, setViewingRecord] = useState<any | null>(null);
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const totalExpenses = initialExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

    // Filter suppliers by agency
    const filteredSuppliers = suppliers.filter(s => s.agencyId === selectedAgencyId);

    // Group by category for the chart
    const categoryDataMap = new Map<string, number>();
    initialExpenses.forEach(exp => {
        const cat = exp.category || "غير مصنف";
        const val = Number(exp.amount);
        categoryDataMap.set(cat, (categoryDataMap.get(cat) || 0) + val);
    });

    const chartData = Array.from(categoryDataMap.entries()).map(([name, value]) => ({ name, value }));

    return (
        <div className="relative min-h-screen -m-6 p-8 bg-gradient-to-br from-orange-50 via-rose-50/30 to-slate-50 overflow-hidden text-slate-800">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-rose-200/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-800 to-rose-600 pb-2">
                        مصروفات التشغيل
                    </h1>
                    <p className="text-slate-500 font-medium ml-1">
                        إدارة النفقات والمصروفات الإدارية
                    </p>
                </div>

                {/* Fixed: Removed 'glass-card' which forced white bg, now bg-orange-500 will apply */}
                <div className="px-8 py-4 rounded-3xl flex items-center gap-5 bg-gradient-to-r from-orange-600 to-rose-600 text-white shadow-2xl shadow-orange-500/30 transform hover:scale-105 transition-transform cursor-default">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/10">
                        <Receipt className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-orange-100 text-xs font-bold uppercase mb-0.5 opacity-90">إجمالي المصروفات</p>
                        <div className="text-4xl font-black tracking-tight drop-shadow-md">{formatMoney(totalExpenses)}</div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid gap-8 lg:grid-cols-3">
                {/* Left Column: Form & Chart */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Add New Expense Form */}
                    <div className="glass-card p-6 rounded-3xl shadow-xl border border-white/60 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-orange-500 to-rose-500"></div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <span className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ArrowDownLeft className="h-4 w-4" /></span>
                            تسجيل مصروف جديد
                        </h3>

                        <form action={createAccountRecord} className="space-y-5">
                            <input type="hidden" name="type" value="EXPENSE" />

                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs font-bold text-slate-500 uppercase">المبلغ المدفوع</Label>
                                <div className="relative">
                                    <Input id="amount" name="amount" type="number" step="0.01" className="pl-8 font-mono text-xl bg-orange-50/50 border-orange-200 focus:ring-orange-500 focus:border-orange-500 h-10 transition-all focus:bg-white" placeholder="0.00" required />
                                    <span className="absolute left-3 top-2 text-orange-400 text-sm font-bold">EGP</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase">بيان المصروف</Label>
                                <Input id="description" name="description" className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all" placeholder="مثال: فاتورة كهرباء" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-xs font-bold text-slate-500 uppercase">التصنيف</Label>
                                    <Input id="category" name="category" className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all" placeholder="تشغيل..." />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="agencyId" className="text-xs font-bold text-slate-500 uppercase">الجهة (التوكيل)</Label>
                                    <Select name="agencyId" value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                                        <SelectTrigger className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all">
                                            <SelectValue placeholder="اختر التوكيل" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GENERAL">مصروف عام</SelectItem>
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

                            <div className="space-y-2">
                                <Label htmlFor="image" className="text-xs font-bold text-slate-500 uppercase">📎 إرفاق الفاتورة / الإيصال (اختياري)</Label>
                                <Input id="image" name="image" type="file" accept="image/*" className="bg-white/60 border-slate-200 h-10 focus:bg-white transition-all file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:bg-orange-100 file:text-orange-700 file:font-semibold hover:file:bg-orange-200" />
                            </div>

                            <Button type="submit" className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg shadow-slate-900/20 py-5 rounded-xl font-bold text-base transition-all active:scale-95">
                                تأكيد الصرف
                            </Button>
                        </form>
                    </div>

                    {/* Chart Section */}
                    {chartData.length > 0 && (
                        <div className="glass-card p-6 rounded-3xl shadow-lg border border-white/60">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="p-2 bg-rose-100 text-rose-600 rounded-lg"><PieChart className="h-4 w-4" /></span>
                                <h3 className="text-lg font-bold text-slate-800">تحليل النفقات</h3>
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
                            <h3 className="text-xl font-bold text-slate-800">سجل عمليات الصرف</h3>
                            <span className="text-xs font-bold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                                {initialExpenses.length} عملية
                            </span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[120px] font-bold text-slate-500/80">التاريخ</TableHead>
                                        <TableHead className="font-bold text-slate-500/80">البيان</TableHead>
                                        <TableHead className="font-bold text-slate-500/80">التصنيف</TableHead>
                                        <TableHead className="text-left pl-6 font-bold text-orange-600/80">القيمة</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialExpenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                                لا يوجد بيانات لعرضها
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        initialExpenses.map((expense) => (
                                            <TableRow key={expense.id} className="group hover:bg-orange-50/40 transition-colors border-0 border-b border-slate-50">
                                                <TableCell className="font-medium text-slate-500 text-xs font-mono py-4">
                                                    {new Date(expense.createdAt).toLocaleDateString('ar-EG')}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-sm">{expense.description}</span>
                                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Building2 className="w-3 h-3" />
                                                            {expense.agency?.name || 'مصروف عام'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {expense.category ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                                                            <Tag className="w-3 h-3 text-slate-400" />
                                                            {expense.category}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-left pl-6 font-black text-orange-600 font-mono text-base py-4">
                                                    {formatMoney(Number(expense.amount))}
                                                </TableCell>
                                                <TableCell className="py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => setViewingRecord(expense)}
                                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition shadow-sm"
                                                        >
                                                            عرض 📄
                                                        </button>
                                                        {(userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY') && (
                                                            <button
                                                                onClick={() => setEditingRecord(expense)}
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
                    type="EXPENSE"
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
                    type="EXPENSE"
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
