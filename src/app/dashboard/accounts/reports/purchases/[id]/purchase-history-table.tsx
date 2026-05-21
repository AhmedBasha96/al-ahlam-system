'use client';

import { useState } from "react";
import { FileText, Wallet, Clock } from "lucide-react";
import { updateTransaction } from "@/lib/actions";
import TransactionModal from "@/components/shared/transaction-modal";

type PurchaseTransaction = {
    id: string;
    type: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentType: 'CASH' | 'CREDIT' | 'PARTIAL';
    createdAt: Date | string;
    note?: string | null;
    user: {
        name: string;
    };
    items: {
        product: {
            name: string;
        };
        quantity: number;
        price: number;
    }[];
}

export default function PurchaseHistoryTable({
    transactions,
    userRole,
    agencyName
}: {
    transactions: PurchaseTransaction[],
    userRole?: string,
    agencyName: string
}) {
    const [viewingTx, setViewingTx] = useState<PurchaseTransaction | null>(null);
    const [editingTx, setEditingTx] = useState<PurchaseTransaction | null>(null);
    const [paymentTx, setPaymentTx] = useState<PurchaseTransaction | null>(null);

    const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY';
    const canPay = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'ACCOUNTANT';

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <h3 className="font-black text-gray-800">تاريخ الحركات المالية</h3>
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    سجل {transactions.length} حركة
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-emerald-800/5 text-[10px] font-black text-emerald-900/60 uppercase border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5">البيان / التاريخ</th>
                            <th className="px-6 py-5">المسؤول</th>
                            <th className="px-6 py-5">الأصناف</th>
                            <th className="px-6 py-5 text-center">القيمة</th>
                            <th className="px-6 py-5 text-center">المدفوع</th>
                            <th className="px-8 py-5 text-center text-red-600">المتبقي</th>
                            <th className="px-6 py-5 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                <td className="px-8 py-5">
                                    <div className="font-black text-gray-900">
                                        {tx.type === 'SUPPLY_PAYMENT' ? (
                                            <span className="text-emerald-700 flex items-center gap-1">
                                                <Wallet className="w-3 h-3" />
                                                سداد مديونية (وصل)
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-3 h-3 text-blue-400" />
                                                فاتورة توريد #{tx.id.slice(0, 8)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold mt-1">
                                        {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    {tx.note && (
                                        <div className="text-[10px] text-blue-400 mt-2 bg-blue-50/50 px-2 py-0.5 rounded-md inline-block max-w-[200px] truncate">
                                            📝 {tx.note}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black border border-blue-100">
                                            {tx.user.name.slice(0, 1)}
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">{tx.user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                        {tx.items.length > 0 ? tx.items.map((item, idx) => (
                                            <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-lg font-bold border border-gray-200 shadow-sm">
                                                {item.product.name} <span className="text-blue-600 ml-1">×{item.quantity}</span>
                                            </span>
                                        )) : <span className="text-gray-400 italic text-[10px] font-bold">حركة مالية فقط</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-5 font-black text-center font-mono">
                                    {tx.type === 'SUPPLY_PAYMENT' ? '---' : tx.totalAmount.toLocaleString()}
                                </td>
                                <td className="px-6 py-5 font-black text-emerald-600 text-center font-mono">
                                    {tx.type === 'SUPPLY_PAYMENT' ? (
                                        <div className="flex flex-col items-center">
                                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs">
                                                +{tx.paidAmount.toLocaleString()}
                                            </span>
                                        </div>
                                    ) : (
                                        tx.paidAmount.toLocaleString()
                                    )}
                                </td>
                                <td className="px-8 py-5 font-black text-red-600 text-center font-mono italic">
                                    {tx.type === 'SUPPLY_PAYMENT' ? '---' : (
                                        tx.remainingAmount > 0 ? (
                                            <div className="flex flex-col items-center">
                                                <span>{tx.remainingAmount.toLocaleString()}</span>
                                                {tx.paymentType === 'CREDIT' && (
                                                    <span className="text-[8px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full mt-1 uppercase font-black">مديونية</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-emerald-500 font-sans text-xs">خالص ✅</span>
                                        )
                                    )}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => setViewingTx(tx)}
                                            className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition"
                                        >
                                            فاتورة 📄
                                        </button>
                                        {canEdit && tx.type === 'PURCHASE' && (
                                            <button
                                                onClick={() => setEditingTx(tx)}
                                                className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition"
                                            >
                                                تعديل ✏️
                                            </button>
                                        )}
                                        {canPay && tx.remainingAmount > 0 && tx.type === 'PURCHASE' && (
                                            <button
                                                onClick={() => setPaymentTx(tx)}
                                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-emerald-700 transition"
                                            >
                                                سداد 📥
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {viewingTx && (
                <TransactionModal
                    id={viewingTx.id}
                    partyName={agencyName}
                    userName={viewingTx.user.name}
                    items={viewingTx.items.map(i => ({
                        productId: '', // Not strictly needed for view
                        productName: i.product.name,
                        quantity: i.quantity,
                        price: i.price,
                        total: i.quantity * i.price
                    }))}
                    paymentInfo={{
                        type: viewingTx.paymentType,
                        paidAmount: viewingTx.paidAmount,
                        totalAmount: viewingTx.totalAmount
                    }}
                    date={viewingTx.createdAt}
                    onClose={() => setViewingTx(null)}
                    type={viewingTx.type as any}
                />
            )}

            {/* Edit Modal */}
            {editingTx && (
                <TransactionModal
                    id={editingTx.id}
                    partyName={agencyName}
                    userName={editingTx.user.name}
                    items={editingTx.items.map(i => ({
                        productId: '',
                        productName: i.product.name,
                        quantity: i.quantity,
                        price: i.price,
                        total: i.quantity * i.price
                    }))}
                    paymentInfo={{
                        type: editingTx.paymentType,
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

            {/* Payment Modal */}
            {paymentTx && (
                <TransactionModal
                    id={paymentTx.id}
                    partyName={agencyName}
                    userName={paymentTx.user.name}
                    items={paymentTx.items.map(i => ({
                        productId: '',
                        productName: i.product.name,
                        quantity: i.quantity,
                        price: i.price,
                        total: i.quantity * i.price
                    }))}
                    paymentInfo={{
                        type: paymentTx.paymentType,
                        paidAmount: paymentTx.paidAmount,
                        totalAmount: paymentTx.totalAmount
                    }}
                    date={paymentTx.createdAt}
                    paymentOnly={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setPaymentTx(null);
                        window.location.reload();
                    }}
                    type={paymentTx.type as any}
                />
            )}
        </div>
    );
}
