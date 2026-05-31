'use client';

import { Printer, Share2, Calendar, User, ShoppingBag, Hash, DollarSign, FileText } from "lucide-react";
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
    discountAmount?: number;
    taxPercentage?: number;
    taxAmount?: number;
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
        <div className="max-w-4xl mx-auto py-10">
            <div
                ref={invoiceRef}
                className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 min-h-[1100px] flex flex-col relative overflow-hidden p-10 font-sans"
                id="printable-invoice"
            >
                {/* Background Decor - Non-printable watermark or accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -mr-32 -mt-32 no-print"></div>

                {/* Header: Brand & Info */}
                <div className="relative flex justify-between items-start mb-10 pb-10 border-b border-slate-100">
                    <div className="flex gap-6">
                        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl p-4">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain brightness-110 contrast-125" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 uppercase italic">{title}</h1>
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    REF-{invoiceId.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-slate-400 text-[10px] font-bold">Document Generated Systematically</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-left space-y-1">
                        <div className="text-4xl font-black text-slate-900 leading-none tracking-tighter">الاحلام <span className="text-indigo-600">للتجارة</span></div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">H&M Business Solutions</div>
                        <div className="flex gap-4 pt-4 text-[9px] font-bold text-slate-500 justify-end">
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3 text-indigo-400" /> 0123456789</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400" /> Cairo, Egypt</span>
                        </div>
                    </div>
                </div>

                {/* Info Grid: Client & Transaction */}
                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="col-span-2 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                        <div className="space-y-4">
                            <div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">صادرة لحساب / Client Name:</span>
                                <div className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    <User className="w-4 h-4 text-indigo-600" />
                                    {partyName}
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">المسؤول / Authorized By:</span>
                                    <span className="text-xs font-bold text-slate-700">{userName}</span>
                                </div>
                                <div className="border-r border-slate-200 h-6 my-auto"></div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase block mb-1">التوثيق / Ref:</span>
                                    <span className="text-xs font-bold text-slate-700 tracking-tighter shrink-0">DB-TX-{invoiceId.slice(-4).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-[2rem] text-white space-y-4 shadow-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">تاريخ الاصدار / Date</span>
                            <span className="text-xs font-black">{new Date(date).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">نظام السداد / Method</span>
                            <span className="text-xs font-black px-2 py-0.5 bg-white/10 rounded-md">
                                {paymentType === 'CASH' ? 'كاش' : paymentType === 'CREDIT' ? 'آجل' : 'جزئي'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table: Modern & Breathable */}
                <div className="flex-grow">
                    <table className="w-full text-right border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                <th className="pb-4 pr-6">#</th>
                                <th className="pb-4 text-slate-900">وصف الصنف / ITEM DESCRIPTION</th>
                                <th className="pb-4 text-center">الكمية</th>
                                <th className="pb-4 text-center">السعر</th>
                                <th className="pb-4 text-center">الخصم</th>
                                <th className="pb-4 text-center">الضريبة</th>
                                <th className="pb-4 text-left pl-6">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold">
                            {items.map((item, idx) => (
                                <tr key={idx} className="group transition-all">
                                    <td className="py-4 pr-6 rounded-r-[1rem] bg-slate-50 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                    <td className="py-4 bg-slate-50">
                                        <div className="text-slate-900 font-black">{item.productName}</div>
                                        <div className="text-[9px] text-slate-400 tracking-tighter">SKU: PX-{item.productId.slice(0, 6).toUpperCase()}</div>
                                    </td>
                                    <td className="py-4 bg-slate-50 text-center font-black text-indigo-600">
                                        <div className="bg-indigo-50 px-2 py-1 rounded-lg inline-block min-w-[60px]">
                                            {item.formattedQuantity || `${item.quantity} Q`}
                                        </div>
                                    </td>
                                    <td className="py-4 bg-slate-50 text-center text-slate-700 font-mono">
                                        {(item.displayPrice || item.price).toLocaleString()}
                                    </td>
                                    <td className="py-4 bg-slate-50 text-center">
                                        {item.discountPercentage ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-rose-600 font-black">%{item.discountPercentage}</span>
                                                <span className="text-[8px] text-rose-300">-{item.discountAmount?.toLocaleString()}</span>
                                            </div>
                                        ) : <span className="text-slate-200">—</span>}
                                    </td>
                                    <td className="py-4 bg-slate-50 text-center">
                                        {item.taxPercentage ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-emerald-600 font-black">%{item.taxPercentage}</span>
                                                <span className="text-[8px] text-emerald-300">+{item.taxAmount?.toLocaleString()}</span>
                                            </div>
                                        ) : <span className="text-slate-200">—</span>}
                                    </td>
                                    <td className="py-4 bg-slate-50 text-left pl-6 rounded-l-[1rem] font-black text-slate-900 group-hover:bg-indigo-50 transition-colors">
                                        {item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Logic: Summary & Auth */}
                <div className="mt-12 pt-10 border-t border-slate-100 flex justify-between items-end">
                    <div className="space-y-10 flex-grow">
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-900 uppercase flex items-center gap-2">
                                <FileText className="w-3 h-3 text-indigo-600" />
                                تحذيرات وشروط قانونية
                            </h4>
                            <p className="text-[9px] text-slate-400 leading-relaxed max-w-[400px]">
                                تعتبر هذه الفاتورة وثيقة ملكية قانونية فور سداد كامل المبلغ الموضح في بند "الصافي النهائي". 
                                في حال الدفع الآجل، يلتزم الطرف الثاني بالسداد في المواعيد المتفق عليها مسبقاً.
                                لا تتحمل الشركة أي مسؤولية عن سوء الاستخدام بعد الاستلام.
                            </p>
                        </div>
                        
                        <div className="flex gap-20">
                            <div className="text-center">
                                <div className="w-32 h-1 bg-slate-100 rounded-full mb-2"></div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">توقيع المستلم</span>
                            </div>
                            <div className="text-center">
                                <div className="w-32 h-1 bg-slate-100 rounded-full mb-2"></div>
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ختم شركة الاحلام</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-[340px] bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-5 shadow-[0_30px_60px_rgba(0,0,0,0.2)]">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-slate-500 uppercase">Sub-Total الإجمالي</span>
                                <span className="font-mono">{summary.baseTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black">
                                <span className="text-rose-400 uppercase">Discounts الخصم</span>
                                <span className="font-mono">-{summary.totalDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black border-b border-white/10 pb-3">
                                <span className="text-emerald-400 uppercase">Taxes الضرائب</span>
                                <span className="font-mono">+{summary.totalTax.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center opacity-70">
                                <span className="text-[9px] font-black">Paid المدفوع</span>
                                <span className="text-xs font-mono">{paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center opacity-70 border-b border-white/10 pb-3">
                                <span className="text-[9px] font-black">Balance المتبقي</span>
                                <span className="text-xs font-mono text-rose-400">{remainingAmount.toLocaleString()}</span>
                            </div>
                            <div className="pt-2">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Grand Total الصافي</div>
                                <div className="text-4xl font-black text-white font-mono tracking-tighter flex items-baseline gap-2">
                                    {totalAmount.toLocaleString()}
                                    <span className="text-xs font-sans text-white/30 tracking-normal italic uppercase">Pounds</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
                        #printable-invoice { 
                            box-shadow: none !important; 
                            border: 2px solid #f8fafc !important; 
                            padding: 1cm !important;
                            max-width: 100% !important;
                            min-height: 100vh !important;
                            border-radius: 0 !important;
                        }
                        .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
                        .bg-indigo-600 { background-color: #4f46e5 !important; -webkit-print-color-adjust: exact; }
                        .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
                        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        tr { page-break-inside: avoid; }
                    }
                `}</style>
            </div>

            {/* Floating Actions for User Experience */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 no-print flex gap-4 bg-white/80 backdrop-blur-xl p-3 rounded-full border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                <Button
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-black text-white font-black px-8 py-6 rounded-full flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                    <Printer className="w-5 h-5 text-indigo-400" />
                    <span>Print Document</span>
                </Button>
                <div className="w-[1px] h-6 bg-slate-200 my-auto mx-2"></div>
                <Button
                    onClick={handleWhatsApp}
                    disabled={isSharing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-6 rounded-full flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50"
                >
                    <Share2 className="w-5 h-5 text-emerald-200" />
                    <span>{isSharing ? 'Analyzing...' : 'Share Report'}</span>
                </Button>
            </div>
        </div>
    );
}
