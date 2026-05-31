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
        <div className="max-w-3xl mx-auto py-6 px-4">
            <div
                ref={invoiceRef}
                className="bg-white rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100 min-h-[1000px] flex flex-col relative overflow-hidden p-8 font-sans transition-all duration-700"
                id="printable-invoice"
                style={{ transform: 'scale(0.98)', transformOrigin: 'top center' }}
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/20 rounded-full blur-3xl -mr-24 -mt-24 no-print"></div>

                {/* Header: Brand & Info */}
                <div className="relative flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl p-3">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain brightness-110" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight mb-0.5 uppercase italic leading-none">{title}</h1>
                            <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                                    REF-{invoiceId.slice(0, 6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-left space-y-0.5">
                        <div className="text-2xl font-black text-slate-900 leading-none tracking-tighter">الاحلام <span className="text-indigo-600 font-black">للتجارة</span></div>
                        <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">H&M Business Solutions</div>
                        <div className="flex gap-3 pt-2 text-[8px] font-bold text-slate-400 justify-end">
                            <span className="flex items-center gap-1"><Hash className="w-2.5 h-2.5" /> 0123456789</span>
                            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Cairo</span>
                        </div>
                    </div>
                </div>

                {/* Info Grid: Client & Transaction */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="col-span-2 bg-slate-50/50 p-4 rounded-[1.2rem] border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all">
                        <div className="space-y-3">
                            <div>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-0.5">صادرة لحساب / Client:</span>
                                <div className="text-lg font-black text-slate-900 flex items-center gap-2 leading-none">
                                    <User className="w-3.5 h-3.5 text-indigo-600" />
                                    {partyName}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">المسؤول / Admin:</span>
                                    <span className="text-[10px] font-bold text-slate-600">{userName}</span>
                                </div>
                                <div className="border-r border-slate-200 h-4 my-auto"></div>
                                <div>
                                    <span className="text-[8px] font-black text-slate-300 uppercase block mb-0.5">التوثيق / Ref:</span>
                                    <span className="text-[10px] font-bold text-slate-500 tracking-tighter">DB-{invoiceId.slice(-4).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-4 rounded-[1.2rem] text-white flex flex-col justify-center space-y-3 shadow-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">تاريخ / Date</span>
                            <span className="text-[10px] font-black">{new Date(date).toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-indigo-200 uppercase tracking-widest">السداد / Method</span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 bg-white/10 rounded-md">
                                {paymentType === 'CASH' ? 'كاش' : paymentType === 'CREDIT' ? 'آجل' : 'جزئي'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Table: Compact & Focused */}
                <div className="flex-grow">
                    <table className="w-full text-right border-separate border-spacing-y-1.5">
                        <thead>
                            <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                <th className="pb-2 pr-4 w-8 text-center font-mono">#</th>
                                <th className="pb-2 text-slate-900">الوصف / Description</th>
                                <th className="pb-2 text-center w-24">الكمية</th>
                                <th className="pb-2 text-center w-16">السعر</th>
                                <th className="pb-2 text-center w-20">الخصم</th>
                                <th className="pb-2 text-center w-20">الضريبة</th>
                                <th className="pb-2 text-left pl-4 w-24 text-indigo-700">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] font-bold">
                            {items.map((item, idx) => (
                                <tr key={idx} className="group">
                                    <td className="py-2.5 pr-4 rounded-r-[0.8rem] bg-slate-50/80 text-slate-400 font-mono text-[9px] text-center border-y border-r border-slate-100">{idx + 1}</td>
                                    <td className="py-2.5 bg-slate-50/80 border-y border-slate-100">
                                        <div className="text-slate-900 font-black leading-tight mb-0.5">{item.productName}</div>
                                        <div className="text-[8px] text-slate-400 font-mono tracking-tighter uppercase opacity-60">ID: {item.productId.slice(0, 6)}</div>
                                    </td>
                                    <td className="py-2.5 bg-slate-50/80 text-center font-black text-indigo-600 border-y border-slate-100">
                                        <div className="bg-indigo-100/50 px-2 py-0.5 rounded-md inline-block min-w-[50px] text-[9px]">
                                            {item.formattedQuantity || item.quantity}
                                        </div>
                                    </td>
                                    <td className="py-2.5 bg-slate-50/80 text-center text-slate-600 font-mono border-y border-slate-100">
                                        {(item.displayPrice || item.price).toLocaleString()}
                                    </td>
                                    <td className="py-2.5 bg-slate-50/80 text-center border-y border-slate-100">
                                        {item.discountPercentage ? (
                                            <div className="flex flex-col items-center leading-none">
                                                <span className="text-rose-600 font-black">%{item.discountPercentage}</span>
                                                <span className="text-[7.5px] text-rose-300 font-mono mt-0.5">{item.discountAmount?.toLocaleString()}</span>
                                            </div>
                                        ) : <span className="text-slate-200">—</span>}
                                    </td>
                                    <td className="py-2.5 bg-slate-50/80 text-center border-y border-slate-100">
                                        {item.taxPercentage ? (
                                            <div className="flex flex-col items-center leading-none">
                                                <span className="text-emerald-600 font-black">%{item.taxPercentage}</span>
                                                <span className="text-[7.5px] text-emerald-300 font-mono mt-0.5">{item.taxAmount?.toLocaleString()}</span>
                                            </div>
                                        ) : <span className="text-slate-200">—</span>}
                                    </td>
                                    <td className="py-2.5 bg-slate-50/80 text-left pl-4 rounded-l-[0.8rem] font-black text-slate-900 border-y border-l border-slate-100 italic">
                                        {item.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Logic: Summary & Auth */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-end">
                    <div className="space-y-6 flex-grow">
                        <div className="space-y-1.5 pt-4">
                            <h4 className="text-[9px] font-black text-slate-900 uppercase flex items-center gap-1.5 tracking-tight group">
                                <FileText className="w-2.5 h-2.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
                                ملاحظات قانونية / Terms
                            </h4>
                            <p className="text-[8px] text-slate-400 leading-tight max-w-[320px]">
                                البضاعة المباعة لا ترد ولا تستبدل إلا في حال وجود عيوب صناعة. 
                                يرجى مراجعة الفاتورة بعناية قبل التوقيع على الاستلام.
                            </p>
                        </div>
                        
                        <div className="flex gap-12">
                            <div className="text-center">
                                <div className="w-24 h-0.5 bg-slate-100 mb-1.5 opacity-50"></div>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">توقيع المستلم</span>
                            </div>
                            <div className="text-center">
                                <div className="w-24 h-0.5 bg-slate-100 mb-1.5 opacity-50"></div>
                                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">ختم الشركة</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-[300px] bg-slate-900 text-white rounded-[1.5rem] p-5 space-y-4 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 no-print"></div>
                        
                        <div className="space-y-2 relative z-10">
                            <div className="flex justify-between items-center text-[9px] font-black opacity-60">
                                <span className="uppercase">الإجمالي الفرعي</span>
                                <span className="font-mono">{summary.baseTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black text-rose-300">
                                <span className="uppercase">إجمالي الخصم</span>
                                <span className="font-mono">-{summary.totalDiscount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-black text-emerald-300 border-b border-white/5 pb-2">
                                <span className="uppercase">إجمالي الضريبة</span>
                                <span className="font-mono">+{summary.totalTax.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5 relative z-10 pt-1">
                            <div className="flex justify-between items-center opacity-50">
                                <span className="text-[8px] font-black uppercase">المدفوع / Paid</span>
                                <span className="text-[10px] font-mono">{paidAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center opacity-50 border-b border-white/5 pb-2">
                                <span className="text-[8px] font-black uppercase">المتبقي / Balance</span>
                                <span className="text-[10px] font-mono text-rose-300">{remainingAmount.toLocaleString()}</span>
                            </div>
                            <div className="pt-2">
                                <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.1em] mb-0.5">الصافي النهائي / GRAND TOTAL</div>
                                <div className="text-3xl font-black text-white font-mono tracking-tighter flex items-baseline gap-1.5">
                                    {totalAmount.toLocaleString()}
                                    <span className="text-[9px] font-sans text-white/30 tracking-normal italic font-medium">Pounds</span>
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
