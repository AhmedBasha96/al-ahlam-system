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
    originalPrice?: number;
    discountPercentage?: number;
    taxPercentage?: number;
    total: number;
    formattedQuantity?: string;
    displayPrice?: number;
    unitsPerCarton?: number;
}

interface InvoiceViewProps {
    invoiceId: string;
    date: Date | string;
    partyName: string;
    userName: string;
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

    // Calculate totals for summary
    const summary = items.reduce((acc, item) => {
        const itemBase = item.quantity * (item.originalPrice || item.price);
        const discountAmount = itemBase * (Number(item.discountPercentage || 0) / 100);
        const taxAmount = itemBase * (Number(item.taxPercentage || 0) / 100);
        
        return {
            baseTotal: acc.baseTotal + itemBase,
            totalDiscount: acc.totalDiscount + discountAmount,
            totalTax: acc.totalTax + taxAmount
        };
    }, { baseTotal: 0, totalDiscount: 0, totalTax: 0 });

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
            await new Promise(r => setTimeout(r, 200));
            const dataUrl = await toPng(invoiceRef.current, {
                quality: 1,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                cacheBust: true,
            });
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `invoice-${invoiceId.slice(0, 8)}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `فاتورة ${invoiceId.slice(0, 8)}`,
                    text: `فاتورة ${title} للعميل ${partyName}`,
                });
            } else {
                const link = document.createElement('a');
                link.download = `invoice-${invoiceId.slice(0, 8)}.png`;
                link.href = dataUrl;
                link.click();
            }
        } catch (error) {
            console.error('Error sharing image:', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div
                ref={invoiceRef}
                className="bg-white p-12 rounded-none md:rounded-3xl shadow-xl border border-slate-100 min-h-[1100px] flex flex-col"
                id="printable-invoice"
            >
                {/* Header Section */}
                <div className="flex justify-between items-center mb-10 pb-8 border-b-2 border-slate-900">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{title}</h1>
                            <div className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-black inline-block">
                                NO: {invoiceId.slice(0, 8).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="text-3xl font-black text-indigo-700">الاحلام للتجارة</div>
                        <div className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">H&M For General Agencies</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-bold">Sales - Purchase - Warehouse Management</div>
                    </div>
                </div>

                {/* Client & Date Info */}
                <div className="grid grid-cols-2 gap-12 mb-10 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">صادرة إلى / {partyLabel}:</span>
                            <span className="text-xl font-black text-slate-900">{partyName}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">المسؤول عن الحركة / {userLabel}:</span>
                            <span className="font-bold text-slate-800">{userName}</span>
                        </div>
                    </div>
                    <div className="space-y-4 text-left">
                        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm">
                            <span className="text-xs font-black text-slate-500">التاريخ:</span>
                            <span className="font-black text-slate-800">{new Date(date).toLocaleDateString('ar-EG', { dateStyle: 'full' })}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm">
                            <span className="text-xs font-black text-slate-500">طريقة السداد:</span>
                            <span className="font-black text-indigo-600">{paymentType === 'CASH' ? 'نقدي (كاش)' : paymentType === 'CREDIT' ? 'آجل' : 'دفع جزئي'}</span>
                        </div>
                    </div>
                </div>

                {/* Main Items Table */}
                <div className="flex-grow mb-12">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-black">
                                <th className="p-4 rounded-tr-xl">اسم الصنف</th>
                                <th className="p-4 text-center">الكمية</th>
                                <th className="p-4 text-center">السعر</th>
                                <th className="p-4 text-center">خصم %</th>
                                <th className="p-4 text-center">ضريبة %</th>
                                <th className="p-4 text-left rounded-tl-xl">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-black text-slate-900">{item.productName}</div>
                                        <div className="text-[9px] text-slate-400 font-bold">Product ID: {item.productId.slice(0,6)}</div>
                                    </td>
                                    <td className="p-4 text-center font-black text-indigo-600">
                                        {item.formattedQuantity || item.quantity}
                                    </td>
                                    <td className="p-4 text-center font-bold text-slate-700">
                                        {(item.displayPrice || item.price).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.discountPercentage ? (
                                            <span className="text-rose-600 font-black text-xs">%{item.discountPercentage}</span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.taxPercentage ? (
                                            <span className="text-emerald-600 font-black text-xs">%{item.taxPercentage}</span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="p-4 text-left font-black text-slate-900 border-l border-slate-50">
                                        {item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals Section */}
                <div className="mt-auto pt-8 border-t-2 border-slate-100">
                    <div className="flex justify-between items-start gap-12">
                        <div className="flex-grow bg-slate-100/50 p-6 rounded-[2rem] border border-slate-200 shadow-inner max-w-sm">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">تفاصيل مالية إضافية</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-bold">إجمالي السعر الأساسي:</span>
                                    <span className="font-mono">{summary.baseTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-rose-500 font-bold">إجمالي الخصومات:</span>
                                    <span className="font-mono">-{summary.totalDiscount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-emerald-600 font-bold">إجمالي الضرائب:</span>
                                    <span className="font-mono">+{summary.totalTax.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-[350px] space-y-4">
                            <div className="flex justify-between items-center px-4 py-2 bg-slate-50 rounded-xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase">المدفوع نقداً</span>
                                <span className="text-xl font-black text-emerald-600 font-mono">{paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-2 bg-rose-50 rounded-xl">
                                <span className="text-[10px] font-black text-rose-400 uppercase">المتبقي (مديونية)</span>
                                <span className="text-xl font-black text-rose-600 font-mono">{remainingAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-indigo-200">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">الإجمالي النهائي</div>
                                <div className="text-4xl font-black font-mono tracking-tighter">
                                    {totalAmount.toLocaleString()} <span className="text-sm font-sans italic opacity-60">EGP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Authorized Signature area for print */}
                    <div className="mt-16 flex justify-between px-12 opacity-0 print:opacity-100">
                        <div className="text-center border-t border-slate-300 pt-2 w-48">
                            <p className="text-xs font-black text-slate-400">توقيع المستلم</p>
                        </div>
                        <div className="text-center border-t border-slate-300 pt-2 w-48">
                            <p className="text-xs font-black text-slate-400">ختم الشركة</p>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; padding: 0 !important; margin: 0 !important; }
                        #printable-invoice { 
                            box-shadow: none !important; 
                            border: none !important; 
                            padding: 2cm !important;
                            max-width: 100% !important;
                            min-height: 100vh !important;
                            border-radius: 0 !important;
                        }
                    }
                `}</style>
            </div>

            {/* Actions Panel */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 no-print px-4">
                <Button
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black py-8 rounded-3xl flex flex-col items-center gap-2 shadow-xl hover:-translate-y-1 transition-all"
                >
                    <Printer className="w-6 h-6" />
                    <span>طباعة الفاتورة (A4)</span>
                </Button>
                <Button
                    onClick={handleWhatsApp}
                    disabled={isSharing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-8 rounded-3xl flex flex-col items-center gap-2 shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                    <Share2 className="w-6 h-6" />
                    <span>{isSharing ? 'جاري التحضير...' : 'مشاركة عبر واتساب'}</span>
                </Button>
            </div>
        </div>
    );
}
