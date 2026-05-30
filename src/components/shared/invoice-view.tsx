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
                className="bg-white p-8 rounded-none md:rounded-3xl shadow-xl border border-slate-100 min-h-[1100px] flex flex-col text-[12px]"
                id="printable-invoice"
            >
                {/* Header Section */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">{title}</h1>
                            <div className="bg-slate-900 text-white px-3 py-1 rounded-md text-[10px] font-black inline-block">
                                NO: {invoiceId.slice(0, 8).toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div className="text-left">
                        <div className="text-xl font-black text-indigo-700 leading-none">الاحلام للتجارة</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">H&M For General Agencies</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-bold">Sales - Purchase - Warehouse Management</div>
                    </div>
                </div>

                {/* Client & Date Info */}
                <div className="grid grid-cols-2 gap-8 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block">صادرة إلى / {partyLabel}:</span>
                            <span className="text-md font-black text-slate-900 leading-none">{partyName}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block">المسؤول / {userLabel}:</span>
                            <span className="font-bold text-slate-700">{userName}</span>
                        </div>
                    </div>
                    <div className="space-y-2 text-left">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400">التاريخ:</span>
                            <span className="font-black text-slate-800">{new Date(date).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400">طريقة السداد:</span>
                            <span className="font-black text-indigo-600 italic">
                                {paymentType === 'CASH' ? 'نقدي' : paymentType === 'CREDIT' ? 'آجل' : 'دفع جزئي'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Items Table */}
                <div className="flex-grow mb-8 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 text-[10px] font-black border-b border-slate-200">
                                <th className="p-2 w-10 text-center">#</th>
                                <th className="p-2">اسم الصنف</th>
                                <th className="p-2 text-center w-20">الكمية</th>
                                <th className="p-2 text-center w-24">السعر</th>
                                <th className="p-2 text-center w-16">خصم%</th>
                                <th className="p-2 text-center w-16">ضريبة%</th>
                                <th className="p-2 text-left w-28">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                                    <td className="p-2">
                                        <div className="font-bold text-slate-800 text-[11px] leading-tight">{item.productName}</div>
                                    </td>
                                    <td className="p-2 text-center font-black text-slate-900">
                                        {item.formattedQuantity || item.quantity}
                                    </td>
                                    <td className="p-2 text-center font-bold text-slate-600">
                                        {(item.displayPrice || item.price).toLocaleString()}
                                    </td>
                                    <td className="p-2 text-center">
                                        {item.discountPercentage ? (
                                            <span className="text-rose-600 font-bold">%{item.discountPercentage}</span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="p-2 text-center">
                                        {item.taxPercentage ? (
                                            <span className="text-emerald-600 font-bold">%{item.taxPercentage}</span>
                                        ) : <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="p-2 text-left font-black text-slate-900 bg-slate-50/30">
                                        {item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totals Section */}
                <div className="mt-auto pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-start">
                        {/* Final Signatures / Notes */}
                        <div className="max-w-[300px] text-[10px] text-slate-400 leading-tight">
                            <p className="font-black text-slate-500 mb-2">ملاحظات:</p>
                            <p>البضاعة المباعة لا ترد ولا تستبدل إلا في حال وجود عيوب صناعة. يرجى مراجعة الفاتورة قبل مغادرة المندوب.</p>
                            <div className="mt-8 flex gap-12 print:mt-12">
                                <div className="text-center w-24">
                                    <div className="border-t border-slate-200 pt-1">إمضاء العميل</div>
                                </div>
                                <div className="text-center w-24">
                                    <div className="border-t border-slate-200 pt-1">ختم الشركة</div>
                                </div>
                            </div>
                        </div>

                        {/* Calculations */}
                        <div className="w-[280px] space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-500 font-bold">إجمالي السعر:</span>
                                <span className="font-mono text-slate-700">{summary.baseTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-rose-500 font-bold">إجمالي الخصم:</span>
                                <span className="font-mono text-rose-600">-{summary.totalDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-emerald-600 font-bold">إجمالي الضريبة:</span>
                                <span className="font-mono text-emerald-700">+{summary.totalTax.toLocaleString()}</span>
                            </div>
                            <div className="h-0.5 bg-slate-200 my-1"></div>
                            <div className="flex justify-between items-center text-xs font-black">
                                <span className="text-slate-400">المدفوع:</span>
                                <span className="text-emerald-600">{paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black">
                                <span className="text-rose-400">المتبقي:</span>
                                <span className="text-rose-600">{remainingAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                                <div className="text-xs font-black text-slate-900 uppercase">الصافي النهائي</div>
                                <div className="text-xl font-black font-mono text-indigo-700">
                                    {totalAmount.toLocaleString()} <span className="text-[10px] font-sans opacity-50">EGP</span>
                                </div>
                            </div>
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
                            padding: 1.5cm !important;
                            max-width: 100% !important;
                            min-height: 100vh !important;
                            border-radius: 0 !important;
                        }
                        tr { page-break-inside: avoid; }
                    }
                `}</style>
            </div>

            {/* Actions Panel */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 no-print px-4 pb-20">
                <Button
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black py-6 rounded-2xl flex flex-col items-center gap-1 shadow-lg hover:-translate-y-0.5 transition-all text-sm"
                >
                    <Printer className="w-5 h-5" />
                    <span>طباعة (A4)</span>
                </Button>
                <Button
                    onClick={handleWhatsApp}
                    disabled={isSharing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 rounded-2xl flex flex-col items-center gap-1 shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 text-sm"
                >
                    <Share2 className="w-5 h-5" />
                    <span>{isSharing ? 'جاري التحضير...' : 'واتساب'}</span>
                </Button>
            </div>
        </div>
    );
}
