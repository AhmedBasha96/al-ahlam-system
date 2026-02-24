'use client';

import { useState } from "react";
import { InvoiceView } from "@/components/shared/invoice-view";

type TransactionItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

type Props = {
    id?: string;
    partyName: string; // Customer or Supplier Name
    userName: string;  // Representative or Responsible User
    items: TransactionItem[];
    paymentInfo?: {
        type: 'CASH' | 'CREDIT' | 'PARTIAL';
        paidAmount?: number;
        totalAmount: number;
    };
    date?: Date | string;
    editable?: boolean;
    paymentOnly?: boolean;
    type?: 'SALE' | 'PURCHASE' | 'RETURN_IN' | 'RETURN_OUT' | 'INITIAL_STOCK' | 'INCOME' | 'EXPENSE';
    onUpdate?: (id: string, updates: any) => Promise<any>;
    onClose: () => void;
}

export default function TransactionModal({
    id,
    partyName,
    userName,
    items,
    paymentInfo,
    date: initialDate,
    editable,
    paymentOnly,
    type = 'SALE',
    onUpdate,
    onClose
}: Props) {
    const [localItems, setLocalItems] = useState(items);
    const [newPaymentAmount, setNewPaymentAmount] = useState("");
    const [saving, setSaving] = useState(false);

    const totalAmount = localItems.reduce((sum: number, item: TransactionItem) => sum + item.total, 0);
    const date = initialDate ? new Date(initialDate) : new Date();

    const updateItem = (index: number, field: 'quantity' | 'price', value: number) => {
        const newItems = [...localItems];
        newItems[index] = {
            ...newItems[index],
            [field]: value,
            total: field === 'quantity' ? value * (newItems[index].price || 0) : value * (newItems[index].quantity || 0)
        };
        setLocalItems(newItems);
    };

    const handleSave = async () => {
        if (!id || !onUpdate) return;
        setSaving(true);
        try {
            const updates: any = {};
            if (editable) {
                updates.items = localItems;
            }
            if (paymentOnly) {
                updates.paidAmount = (paymentInfo?.paidAmount || 0) + (parseFloat(newPaymentAmount) || 0);
            }
            await onUpdate(id, updates);
            alert("تم حفظ التعديلات بنجاح");
            onClose();
        } catch (error) {
            alert("خطأ في الحفظ: " + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl">
                {!editable && !paymentOnly ? (
                    <div className="animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={onClose}
                            className="absolute -top-12 left-0 text-white font-bold flex items-center gap-2 hover:text-emerald-400 transition"
                        >
                            ✕ إغلاق
                        </button>
                        <InvoiceView
                            invoiceId={id || "NEW"}
                            date={date}
                            partyName={partyName}
                            userName={userName}
                            items={items}
                            totalAmount={paymentInfo?.totalAmount || totalAmount}
                            paidAmount={paymentInfo?.paidAmount}
                            remainingAmount={(paymentInfo?.totalAmount || totalAmount) - (paymentInfo?.paidAmount || 0)}
                            paymentType={paymentInfo?.type || 'CASH'}
                            type={type}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <span className="p-2 bg-white/10 rounded-xl">📄</span>
                                {editable ? 'تعديل الفاتورة' : 'تحصيل مديونية'}
                            </h3>
                            <button onClick={onClose} className="hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-xl transition font-bold">
                                ✕
                            </button>
                        </div>

                        <div className="p-8">
                            {/* Payment Collection UI */}
                            {paymentOnly && (
                                <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 mb-8">
                                    <h3 className="text-lg font-black text-emerald-800 mb-4 flex items-center gap-2">
                                        تحصيل مبلغ جديد 📥
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-emerald-600 uppercase tracking-widest">المبلغ المطلوب تحصيله</label>
                                            <input
                                                type="number"
                                                value={newPaymentAmount}
                                                onChange={(e) => setNewPaymentAmount(e.target.value)}
                                                className="w-full border-2 border-emerald-200 rounded-2xl p-4 text-2xl font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-center">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">المديونية المتبقية</p>
                                            <p className="text-3xl font-black text-rose-600">
                                                {(totalAmount - (paymentInfo?.paidAmount || 0) - (parseFloat(newPaymentAmount) || 0)).toLocaleString()} ج.م
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Editable Items Table */}
                            {editable && (
                                <div className="rounded-2xl border border-slate-100 overflow-hidden mb-8">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <tr>
                                                <th className="p-4">الصنف</th>
                                                <th className="p-4 text-center">الكمية</th>
                                                <th className="p-4 text-center">السعر</th>
                                                <th className="p-4 text-left">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {localItems.map((item: TransactionItem, index: number) => (
                                                <tr key={index}>
                                                    <td className="p-4 font-bold text-slate-800">{item.productName}</td>
                                                    <td className="p-4 text-center">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-20 border-2 border-slate-100 rounded-xl p-2 text-center font-black text-indigo-600 focus:border-indigo-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <input
                                                            type="number"
                                                            value={item.price}
                                                            onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                                                            className="w-24 border-2 border-slate-100 rounded-xl p-2 text-center font-bold text-slate-600 focus:border-indigo-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="p-4 text-left font-black text-slate-900">{item.total.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                                <button
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-slate-600 font-bold px-6 py-2 transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition shadow-xl shadow-slate-200 disabled:opacity-50"
                                >
                                    {saving ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
