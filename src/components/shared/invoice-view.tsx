'use client';

import { DollarSign, Printer, Share2, Calendar, User, ShoppingBag, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
}

interface InvoiceViewProps {
    invoiceId: string;
    date: Date | string;
    customerName: string;
    repName: string;
    items: InvoiceItem[];
    totalAmount: number;
    paidAmount?: number;
    remainingAmount?: number;
    paymentType: string;
}

export function InvoiceView({
    invoiceId,
    date,
    customerName,
    repName,
    items,
    totalAmount,
    paidAmount = 0,
    remainingAmount = 0,
    paymentType
}: InvoiceViewProps) {
    const handlePrint = () => {
        window.print();
    };

    const handleWhatsApp = () => {
        const message = `
*فاتورة مبيعات - الاحلام*
📅 *التاريخ:* ${new Date(date).toLocaleDateString('ar-EG')}
🧾 *رقم:* ${invoiceId}
👤 *العميل:* ${customerName}
🛒 *الأصناف:*
${items.map(i => `- ${i.productName} (${i.quantity} × ${i.price} = ${i.total})`).join('\n')}
------------------
💰 *الإجمالي:* ${totalAmount.toLocaleString()} ج.م
💸 *المدفوع:* ${paidAmount.toLocaleString()} ج.م
🏦 *المتبقي:* ${remainingAmount.toLocaleString()} ج.م
        `.trim();

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-2xl mx-auto border border-slate-100" id="printable-invoice">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">فاتورة مبيعات</h1>
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <Hash className="w-4 h-4" />
                        <span>رقم الفاتورة: {invoiceId.slice(0, 8)}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-indigo-600 mb-1">الاحلام للتجارة</div>
                    <div className="text-sm text-slate-400 font-bold tracking-widest uppercase">Sales Invoice</div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8 pb-8 border-b border-slate-50">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">العميل</div>
                            <div className="font-bold text-slate-800">{customerName}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">التاريخ</div>
                            <div className="font-bold text-slate-800">{new Date(date).toLocaleDateString('ar-EG')}</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">المندوب</div>
                            <div className="font-bold text-slate-800">{repName}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">طريقة الدفع</div>
                            <div className="font-bold text-slate-800">{paymentType === 'CASH' ? 'نقدي (كاش)' : paymentType === 'CREDIT' ? 'آجل' : 'دفع جزئي'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-right">
                    <thead>
                        <tr className="text-slate-400 text-xs font-black uppercase border-b border-slate-50">
                            <th className="py-4 text-right">الصنف</th>
                            <th className="py-4 text-center">الكمية</th>
                            <th className="py-4 text-center">السعر</th>
                            <th className="py-4 text-left">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.map((item, idx) => (
                            <tr key={idx} className="group">
                                <td className="py-4 font-bold text-slate-800">{item.productName}</td>
                                <td className="py-4 text-center font-black text-indigo-600">{item.quantity}</td>
                                <td className="py-4 text-center text-slate-500 font-medium">{item.price.toLocaleString()}</td>
                                <td className="py-4 text-left font-black text-slate-900">{item.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="bg-slate-50 rounded-3xl p-6 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                    <span>إجمالي الفاتورة</span>
                    <span>{totalAmount.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-emerald-600">
                    <span>تحصيل (كاش)</span>
                    <span>{paidAmount.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                    <span className="text-lg font-black text-slate-900">المتبقي مديونية</span>
                    <span className="text-2xl font-black text-indigo-600">{remainingAmount.toLocaleString()} ج.م</span>
                </div>
            </div>

            {/* Actions (Hidden on Print) */}
            <div className="mt-8 grid grid-cols-2 gap-4 no-print">
                <Button
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-2xl flex gap-2"
                >
                    <Printer className="w-5 h-5" />
                    طباعة الفاتورة
                </Button>
                <Button
                    onClick={handleWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl flex gap-2"
                >
                    <Share2 className="w-5 h-5" />
                    ارسال عبر واتساب
                </Button>
            </div>

            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    #printable-invoice { 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important;
                        max-width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}
