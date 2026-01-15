'use client';

import { useState } from "react";

type SoldItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

type Props = {
    id?: string;
    repId?: string;
    repName: string;
    customerName?: string;
    items: SoldItem[];
    paymentInfo?: {
        type: 'CASH' | 'CREDIT' | 'PARTIAL';
        paidAmount?: number;
        totalAmount: number;
    };
    date?: Date | string;
    editable?: boolean;
    paymentOnly?: boolean;
    onUpdate?: (id: string, updates: any) => Promise<any>;
    onClose: () => void;
}

export default function SalesInvoiceModal({ id, repId, repName, customerName, items, paymentInfo, date: initialDate, editable, paymentOnly, onUpdate, onClose }: Props) {
    const [localItems, setLocalItems] = useState(items);
    const [newPaymentAmount, setNewPaymentAmount] = useState("");
    const [saving, setSaving] = useState(false);

    const totalAmount = localItems.reduce((sum: number, item: SoldItem) => sum + item.total, 0);
    const date = initialDate ? new Date(initialDate).toLocaleString('en-US') : new Date().toLocaleString('en-US');

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:w-full print:max-w-none print:rounded-none">

                {/* Header - Hidden on Print */}
                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white print:hidden">
                    <h3 className="font-bold flex items-center gap-2">
                        <span>📄</span> {editable ? 'تعديل فاتورة البيع' : (paymentOnly ? 'تحصيل مديونية الفاتورة' : 'فاتورة مبيعات المندوب')}
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2"
                        >
                            <span>🖨️</span> طباعة / حفظ PDF
                        </button>
                        <button onClick={onClose} className="hover:bg-emerald-700 w-8 h-8 flex items-center justify-center rounded-full transition">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="p-8 print:p-0" id="invoice-content">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-emerald-700 mb-1">الأحلام للتوكيلات التجارية</h1>
                            <p className="text-gray-500 font-medium font-mono text-sm">نظام إدارة التوزيع والتحصيل</p>
                        </div>
                        <div className="text-left py-2 px-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-bold mb-1">تاريخ الفاتورة</p>
                            <p className="font-bold text-gray-800">{date}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">بيانات المندوب والعميل</h4>
                            <p className="text-xl font-bold text-gray-900">{repName}</p>
                            {customerName && (
                                <p className="text-emerald-700 font-bold mt-1 border-t border-emerald-100 pt-1 flex items-center gap-2">
                                    <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">إلى:</span>
                                    {customerName}
                                </p>
                            )}
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">نوع المستند وطريقة الدفع</h4>
                            <p className="text-xl font-bold text-emerald-700">تصفية مبيعات (جرد)</p>
                            {paymentInfo && (
                                <div className="mt-1 border-t border-emerald-100 pt-1 flex items-center justify-end gap-2 text-sm font-bold">
                                    <span className={`px-2 py-0.5 rounded ${paymentInfo.type === 'CASH' ? 'bg-green-100 text-green-700' :
                                        paymentInfo.type === 'CREDIT' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {paymentInfo.type === 'CASH' ? 'نقدي (كاش)' :
                                            paymentInfo.type === 'CREDIT' ? 'آجل (مديونية)' :
                                                'دفع جزئي'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Collection UI (Only in paymentOnly mode) */}
                    {paymentOnly && (
                        <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-200 mb-8 print:hidden">
                            <h3 className="text-lg font-black text-emerald-800 mb-4">تحصيل مبلغ جديد 📥</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-emerald-600 mb-2">المبلغ المطلوب تحصيله حالياً (ج.م)</label>
                                    <input
                                        type="number"
                                        value={newPaymentAmount}
                                        onChange={(e) => setNewPaymentAmount(e.target.value)}
                                        className="w-full border-2 border-emerald-300 rounded-xl p-3 text-xl font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-100"
                                        placeholder="مثال: 500"
                                        autoFocus
                                    />
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">المديونية المتبقية</p>
                                    <p className="text-xl font-black text-red-600">
                                        {(totalAmount - (paymentInfo?.paidAmount || 0) - (parseFloat(newPaymentAmount) || 0)).toLocaleString('en-US')} ج.م
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <table className="w-full text-right border-collapse mb-8">
                        <thead>
                            <tr className="bg-emerald-700 text-white">
                                <th className="p-3 font-bold border border-emerald-800 rounded-tr-lg">#</th>
                                <th className="p-3 font-bold border border-emerald-800">الصنف</th>
                                <th className="p-3 font-bold border border-emerald-800 text-center">الكمية المباعة</th>
                                <th className="p-3 font-bold border border-emerald-800 text-center">سعر الوحدة</th>
                                <th className="p-3 font-bold border border-emerald-800 text-center rounded-tl-lg">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {localItems.map((item, index) => (
                                <tr key={index} className="even:bg-gray-50">
                                    <td className="p-3 border border-gray-200 text-sm font-mono">{index + 1}</td>
                                    <td className="p-3 border border-gray-200 font-bold">{item.productName}</td>
                                    <td className="p-3 border border-gray-200 text-center font-bold text-emerald-700">
                                        {editable ? (
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                className="w-20 border rounded p-1 text-center bg-white"
                                            />
                                        ) : item.quantity}
                                    </td>
                                    <td className="p-3 border border-gray-200 text-center font-mono">
                                        {editable ? (
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateItem(index, 'price', parseInt(e.target.value) || 0)}
                                                className="w-20 border rounded p-1 text-center bg-white"
                                            />
                                        ) : item.price.toLocaleString('en-US')}
                                    </td>
                                    <td className="p-3 border border-gray-200 text-center font-black">{item.total.toLocaleString('en-US')} ج.م</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-emerald-50">
                                <td colSpan={4} className="p-4 text-left font-black text-emerald-800 border border-emerald-100">الإجمالي الكلي المستحق:</td>
                                <td className="p-4 text-center font-black text-2xl text-emerald-700 border border-emerald-200">{totalAmount.toLocaleString('en-US')} ج.م</td>
                            </tr>
                            {paymentInfo?.type === 'PARTIAL' && (
                                <>
                                    <tr className="bg-white">
                                        <td colSpan={4} className="p-3 text-left font-bold text-blue-800 border-x border-blue-50">المبلغ المدفوع حـالياً:</td>
                                        <td className="p-3 text-center font-black text-xl text-blue-600 border border-blue-100">-{paymentInfo.paidAmount?.toLocaleString('en-US')} ج.م</td>
                                    </tr>
                                    <tr className="bg-red-50/30">
                                        <td colSpan={4} className="p-3 text-left font-black text-red-800 border-x border-red-50">المتبقي (مديونية للعميل):</td>
                                        <td className="p-3 text-center font-black text-xl text-red-600 border border-red-100">{(totalAmount - (paymentInfo.paidAmount || 0)).toLocaleString('en-US')} ج.م</td>
                                    </tr>
                                </>
                            )}
                            {paymentInfo?.type === 'CREDIT' && (
                                <tr className="bg-red-50/30">
                                    <td colSpan={4} className="p-3 text-left font-black text-red-800 border-x border-red-50">حالة الفاتورة (آجل):</td>
                                    <td className="p-3 text-center font-black text-xl text-red-600 border border-red-100">إجمالي المبلغ مديونية</td>
                                </tr>
                            )}
                        </tfoot>
                    </table>

                    <div className="grid grid-cols-2 gap-12 mt-16 px-4">
                        <div className="text-center border-t border-dashed border-gray-300 pt-4">
                            <p className="text-sm font-bold text-gray-400 mb-8">توقيع المستلم (المخزن)</p>
                            <div className="h-1 bg-gray-100 w-32 mx-auto"></div>
                        </div>
                        <div className="text-center border-t border-dashed border-gray-300 pt-4">
                            <p className="text-sm font-bold text-gray-400 mb-8">توقيع المندوب</p>
                            <div className="h-1 bg-gray-100 w-32 mx-auto"></div>
                        </div>
                    </div>

                    <div className="mt-20 pt-8 border-t border-gray-100 text-center text-[10px] text-gray-400 print:block hidden">
                        هذه الفاتورة تم إصدارها آلياً من نظام الأحلام للتوكيلات التجارية - 2026
                    </div>
                </div>

                {/* Footer - Hidden on Print */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 text-left print:hidden">
                    <div className="flex justify-between items-center">
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold px-4 py-2">
                            {(editable || paymentOnly) ? 'إلغاء' : 'إغلاق'}
                        </button>
                        {(editable || paymentOnly) && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg disabled:opacity-50"
                            >
                                {saving ? 'جاري الحفظ...' : (paymentOnly ? 'تأكيد عملية التحصيل 💰' : 'حفظ التعديلات النهائية')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #invoice-content, #invoice-content * {
                        visibility: visible;
                    }
                    #invoice-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
