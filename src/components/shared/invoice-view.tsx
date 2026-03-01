'use client';

import { Printer, Share2, Calendar, User, ShoppingBag, Hash, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";

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
    partyName: string; // Customer or Supplier Name
    userName: string;  // Representative or User Name
    items: InvoiceItem[];
    totalAmount: number;
    paidAmount?: number;
    remainingAmount?: number;
    paymentType: string;
    type?: 'SALE' | 'PURCHASE' | 'RETURN_IN' | 'RETURN_OUT' | 'INITIAL_STOCK' | 'INCOME' | 'EXPENSE';
}

export function InvoiceView({
    invoiceId,
    date,
    partyName,
    userName,
    items,
    totalAmount,
    paidAmount = 0,
    remainingAmount = 0,
    paymentType,
    type = 'SALE'
}: InvoiceViewProps) {
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const isPurchase = type === 'PURCHASE' || type === 'RETURN_OUT';
    const isReturn = type === 'RETURN_IN' || type === 'RETURN_OUT';
    const isInitial = type === 'INITIAL_STOCK';

    const title = isInitial ? "رصيد بضاعة أول المدة" :
        isReturn ? "فاتورة مرتجع" :
            isPurchase ? "فاتورة مشتريات" :
                type === 'INCOME' ? "إيصال توريد نقدية" :
                    type === 'EXPENSE' ? "إيصال صرف نقدية" : "فاتورة مبيعات";

    const partyLabel = isPurchase ? "المورد" : "العميل";
    const userLabel = isPurchase ? "المستلم" : "المندوب";

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsApp = async () => {
        if (!invoiceRef.current) return;

        setIsSharing(true);
        try {
            // Give it a tiny bit of time to ensure it's rendered correctly
            await new Promise(r => setTimeout(r, 200));

            const dataUrl = await toPng(invoiceRef.current, {
                quality: 1,
                backgroundColor: '#ffffff',
                pixelRatio: 2, // Better quality for mobile
                cacheBust: true,
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `invoice-${invoiceId.slice(0, 8)}.png`, { type: 'image/png' });

            // Check if Web Share API is available and can share files
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `فاتورة ${invoiceId.slice(0, 8)}`,
                    text: `فاتورة ${title} للعميل ${partyName}`,
                });
            } else {
                // Fallback: Download the image on desktop/browsers without share API
                const link = document.createElement('a');
                link.download = `invoice-${invoiceId.slice(0, 8)}.png`;
                link.href = dataUrl;
                link.click();
                alert("تم تحميل صورة الفاتورة. يرجى إرسالها يدوياً عبر واتساب.");
            }
        } catch (error) {
            console.error('Error sharing image:', error);
            alert("عذراً، حدث خطأ أثناء تحويل الفاتورة لصورة.");
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div
                ref={invoiceRef}
                className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
                id="printable-invoice"
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{title}</h1>
                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                            <Hash className="w-4 h-4" />
                            <span>رقم الفاتورة: {invoiceId.slice(0, 8)}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600 mb-1">الاحلام للتجارة</div>
                        <div className="text-sm text-slate-400 font-bold tracking-widest uppercase">
                            {type === 'SALE' ? 'Sales Invoice' : type === 'PURCHASE' ? 'Purchase Invoice' : type === 'INCOME' ? 'Income Voucher' : type === 'EXPENSE' ? 'Expense Voucher' : 'Transaction Record'}
                        </div>
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
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{partyLabel}</div>
                                <div className="font-bold text-slate-800">{partyName}</div>
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
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{userLabel}</div>
                                <div className="font-bold text-slate-800">{userName}</div>
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
                        <span>المدفوع</span>
                        <span>{paidAmount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="text-lg font-black text-slate-900">المتبقي</span>
                        <span className="text-2xl font-black text-indigo-600">{remainingAmount.toLocaleString()} ج.م</span>
                    </div>
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

            {/* Actions (Hidden on Print & Not Captured in Image) */}
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
                    disabled={isSharing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-2xl flex gap-2 disabled:opacity-50"
                >
                    <Share2 className="w-5 h-5" />
                    {isSharing ? 'جاري التحويل...' : 'ارسال صوره عبر واتساب'}
                </Button>
            </div>
        </div>
    );
}
