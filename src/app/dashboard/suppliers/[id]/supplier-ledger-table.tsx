'use client';

import { useState } from "react";
import { Receipt, ArrowUpRight, Calendar, FileText, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateTransaction } from "@/lib/actions";
import TransactionModal from "@/components/shared/transaction-modal";

type LedgerItem = {
    id: string;
    date: Date | string;
    type: 'TRANSACTION' | 'ACCOUNT';
    action: string;
    amount: number;
    paid: number;
    balance: number;
    note: string;
    items?: number | null;
    rawTransaction?: any;
}

export default function SupplierLedgerTable({
    initialLedger,
    userRole,
    supplierName
}: {
    initialLedger: any[],
    userRole?: string,
    supplierName: string
}) {
    const [viewingTx, setViewingTx] = useState<any | null>(null);
    const [editingTx, setEditingTx] = useState<any | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY';

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
    };

    // Recalculate running balance
    let runningBalance = 0;
    const sortedLedger = [...initialLedger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const ledgerWithBalance = sortedLedger.map(item => {
        runningBalance += item.balance;
        return { ...item, runningBalance };
    });

    const displayLedger = [...ledgerWithBalance].reverse();

    return (
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
                            <TableHead className="text-center font-bold text-slate-400 py-6">الإجراءات</TableHead>
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
                                <TableCell className="text-center py-6">
                                    {item.type === 'TRANSACTION' && (
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setViewingTx(item.rawTransaction)}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition shadow-lg"
                                            >
                                                فاتورة 📄
                                            </button>
                                            {canEdit && (
                                                <button
                                                    onClick={() => setEditingTx(item.rawTransaction)}
                                                    className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition"
                                                >
                                                    تعديل ✏️
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* View Modal */}
            {viewingTx && (
                <TransactionModal
                    id={viewingTx.id}
                    partyName={supplierName}
                    userName={viewingTx.user.name}
                    items={viewingTx.items.map((i: any) => ({
                        productId: i.productId,
                        productName: i.product.name,
                        quantity: i.quantity,
                        price: Number(i.price),
                        total: i.quantity * Number(i.price)
                    }))}
                    paymentInfo={{
                        type: viewingTx.paymentType,
                        paidAmount: Number(viewingTx.paidAmount),
                        totalAmount: Number(viewingTx.totalAmount)
                    }}
                    date={viewingTx.createdAt}
                    onClose={() => setViewingTx(null)}
                    type={viewingTx.type}
                />
            )}

            {/* Edit Modal */}
            {editingTx && (
                <TransactionModal
                    id={editingTx.id}
                    partyName={supplierName}
                    userName={editingTx.user.name}
                    items={editingTx.items.map((i: any) => ({
                        productId: i.productId,
                        productName: i.product.name,
                        quantity: i.quantity,
                        price: Number(i.price),
                        total: i.quantity * Number(i.price)
                    }))}
                    paymentInfo={{
                        type: editingTx.paymentType,
                        paidAmount: Number(editingTx.paidAmount),
                        totalAmount: Number(editingTx.totalAmount)
                    }}
                    date={editingTx.createdAt}
                    editable={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setEditingTx(null);
                        window.location.reload();
                    }}
                    type={editingTx.type}
                />
            )}
        </div>
    );
}
