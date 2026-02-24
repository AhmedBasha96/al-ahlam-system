'use client';

import { useState } from "react";
import { updateTransaction } from "@/lib/actions";
import TransactionModal from "@/components/shared/transaction-modal";

type Transaction = {
    id: string;
    type: string;
    createdAt: Date | string;
    note?: string | null;
    paymentType?: string | null;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    items: any[];
    user?: { name: string };
};

type Props = {
    transactions: Transaction[];
    customerName: string;
    userRole?: string;
};

export default function CustomerLedgerTable({ transactions, customerName, userRole }: Props) {
    const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY';

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-4">البيان / التاريخ</th>
                        <th className="px-6 py-4">الحالة/الطريقة</th>
                        <th className="px-6 py-4">قيمة العملية</th>
                        <th className="px-6 py-4 text-emerald-700">المحصل/المدفوع</th>
                        <th className="px-6 py-4 text-red-600">المتبقي (دين)</th>
                        <th className="px-6 py-4 text-center text-slate-400 font-black">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                    {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-bold text-gray-900">
                                    {transaction.type === 'COLLECTION' ? '💰 تحصيل مديونية' :
                                        transaction.type === 'SALE' ? `#INV-${transaction.id.slice(0, 8)}` :
                                            transaction.type}
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(transaction.createdAt).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                {transaction.note && (
                                    <div className="text-[10px] text-gray-400 mt-1 italic">{transaction.note}</div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-xs">
                                {transaction.type === 'COLLECTION' ? (
                                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-bold">تحصيل نقدي</span>
                                ) : (
                                    <span className={`px-2 py-1 rounded-full font-black ${transaction.paymentType === 'CASH' ? 'bg-emerald-100 text-emerald-700' :
                                        transaction.paymentType === 'CREDIT' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {transaction.paymentType === 'CASH' ? 'نقدي' :
                                            transaction.paymentType === 'CREDIT' ? 'آجل' : 'جزئي'}
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 font-bold">
                                {transaction.type === 'COLLECTION' ? '---' : Number(transaction.totalAmount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-emerald-700 font-bold">
                                {transaction.type === 'COLLECTION' ? (
                                    <span className="text-blue-600">+{Number(transaction.paidAmount).toLocaleString()}</span>
                                ) : (
                                    Number(transaction.paidAmount || 0).toLocaleString()
                                )}
                            </td>
                            <td className="px-6 py-4 text-red-600 font-black">
                                {transaction.type === 'COLLECTION' ? '---' : Number(transaction.remainingAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => setViewingTx(transaction)}
                                        className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition shadow-sm"
                                    >
                                        فاتورة 📄
                                    </button>
                                    {canEdit && (
                                        <button
                                            onClick={() => setEditingTx(transaction)}
                                            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition shadow-sm"
                                        >
                                            تعديل ✏️
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                لا توجد مبيعات أو تحصيلات مسجلة لهذا العميل بعد
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Modals */}
            {viewingTx && (
                <TransactionModal
                    id={viewingTx.id}
                    partyName={customerName}
                    userName={viewingTx.user?.name || "النظام"}
                    items={viewingTx.items || []}
                    paymentInfo={{
                        type: viewingTx.paymentType as any,
                        paidAmount: viewingTx.paidAmount,
                        totalAmount: viewingTx.totalAmount
                    }}
                    date={viewingTx.createdAt}
                    onClose={() => setViewingTx(null)}
                    type={viewingTx.type as any}
                />
            )}

            {editingTx && (
                <TransactionModal
                    id={editingTx.id}
                    partyName={customerName}
                    userName={editingTx.user?.name || "النظام"}
                    items={editingTx.items || []}
                    paymentInfo={{
                        type: editingTx.paymentType as any,
                        paidAmount: editingTx.paidAmount,
                        totalAmount: editingTx.totalAmount
                    }}
                    date={editingTx.createdAt}
                    editable={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setEditingTx(null);
                        window.location.reload();
                    }}
                    type={editingTx.type as any}
                />
            )}
        </div>
    );
}
