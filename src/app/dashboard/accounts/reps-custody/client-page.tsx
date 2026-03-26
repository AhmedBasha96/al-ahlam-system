
'use client';

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowDownCircle, History, User as UserIcon, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { recordRepSubmission, getRepsWithCustody } from "@/lib/actions";

export default function RepsCustodyClient({ initialReps }: { initialReps: any[] }) {
    const [reps, setReps] = useState(initialReps);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [amounts, setAmounts] = useState<{ [id: string]: string }>({});
    const [notes, setNotes] = useState<{ [id: string]: string }>({});

    const handleSubmission = async (repId: string) => {
        const amount = parseFloat(amounts[repId]);
        if (!amount || amount <= 0) return alert("يرجى إدخال مبلغ صحيح");

        setSubmitting(repId);
        try {
            const result = await recordRepSubmission(repId, amount, notes[repId]);
            if (result.success) {
                alert("تم استلام المبلغ بنجاح وتحديث الخزينة");
                // Refresh data
                const updated = await getRepsWithCustody();
                setReps(updated);
                setAmounts(prev => ({ ...prev, [repId]: "" }));
                setNotes(prev => ({ ...prev, [repId]: "" }));
            } else {
                alert("حدث خطأ: " + (result as any).error);
            }
        } catch (error) {
            alert("فشل في العملية");
        } finally {
            setSubmitting(null);
        }
    };

    const formatMoney = (val: number) => val.toLocaleString() + " ج.م";

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl">
                        <Wallet className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة تحصيلات وعهد المناديب</h1>
                        <p className="text-slate-400 font-bold text-sm">متابعة المبالغ النقدية الموجودة مع المناديب واستلامها</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {reps.map((rep) => (
                    <Card key={rep.id} className="p-0 overflow-hidden rounded-[32px] border-none shadow-xl shadow-slate-200/50">
                        <div className="grid grid-cols-1 xl:grid-cols-12">
                            {/* Rep Info & Submission Side */}
                            <div className="xl:col-span-5 bg-white p-8 border-b xl:border-b-0 xl:border-l border-slate-50">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                                        {rep.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800">{rep.name}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">مندوب مبيعات</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-6 rounded-[24px]">
                                        <p className="text-xs font-black text-slate-400 uppercase mb-2">إجمالي النقدية المحصلة (العهدة الحالية)</p>
                                        <div className="flex items-end justify-between">
                                            <span className="text-4xl font-black text-emerald-600">
                                                {formatMoney(rep.currentCustody)}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] font-black p-1.5 px-3 bg-emerald-100/50 text-emerald-700 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" />
                                                جاهز للإستلام
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submission Form */}
                                    <div className="space-y-4 pt-4">
                                        <h4 className="text-sm font-black text-slate-700 flex items-center gap-2">
                                            <ArrowDownCircle className="w-4 h-4 text-slate-400" />
                                            استلام مبلغ توريد من المندوب
                                        </h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="relative">
                                                <Input 
                                                    placeholder="أدخل المبلغ..."
                                                    type="number"
                                                    value={amounts[rep.id] || ""}
                                                    onChange={e => setAmounts(prev => ({ ...prev, [rep.id]: e.target.value }))}
                                                    className="p-6 h-14 text-xl font-black rounded-2xl border-2 border-slate-100 focus:border-emerald-500 transition-all bg-slate-50/30"
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">ج.م</span>
                                            </div>
                                            <Input 
                                                placeholder="ملاحظات (اختياري)..."
                                                value={notes[rep.id] || ""}
                                                onChange={e => setNotes(prev => ({ ...prev, [rep.id]: e.target.value }))}
                                                className="p-6 h-12 rounded-xl border-slate-100"
                                            />
                                            <Button 
                                                onClick={() => handleSubmission(rep.id)}
                                                disabled={submitting === rep.id || !amounts[rep.id]}
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-black text-lg gap-3"
                                            >
                                                {submitting === rep.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6" />}
                                                تأكيد استلام وتوريد للخزينة
                                            </Button>
                                            
                                            {parseFloat(amounts[rep.id]) > rep.currentCustody && (
                                                <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                                                    <ShieldAlert className="w-4 h-4 shrink-0" />
                                                    <p className="text-[10px] font-bold">تنبيه: المبلغ أكبر من المحصل حالياً مع المندوب. العملية قد تُرفض من السيستم.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Collections History */}
                            <div className="xl:col-span-7 bg-slate-50/30 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-black text-slate-700 flex items-center gap-2 uppercase tracking-wide">
                                        <History className="w-4 h-4 text-slate-400" />
                                        آخر 10 تحصيلات تمت بواسطة المندوب
                                    </h4>
                                    <span className="p-1 px-3 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400">سجل التحصيلات</span>
                                </div>

                                <div className="rounded-2xl border border-slate-50 bg-white shadow-sm overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50/50">
                                            <TableRow>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase">التاريخ</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase">العميل / المصدر</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase">النوع</TableHead>
                                                <TableHead className="font-black text-[10px] text-slate-400 uppercase text-left">المبلغ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rep.recentCollections.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center p-12 text-slate-300 font-bold italic">
                                                        لا توجد تحصيلات مرصودة لهذه الفترة
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                rep.recentCollections.map((col: any) => (
                                                    <TableRow key={col.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <TableCell className="text-[11px] font-bold text-slate-500 py-4">
                                                            {new Date(col.date).toLocaleDateString('ar-EG')}
                                                        </TableCell>
                                                        <TableCell className="font-black text-slate-700">{col.customerName}</TableCell>
                                                        <TableCell>
                                                            <span className={`p-1 px-2 rounded-md text-[9px] font-black uppercase tracking-tighter ${col.type === 'SALE' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                                {col.type === 'SALE' ? 'مبيعات' : 'تحصيل دين'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-left font-black text-emerald-600">
                                                            +{col.amount.toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي ما سلمه المندوب للمكتب</p>
                                        <p className="text-xl font-black text-slate-800">{formatMoney(rep.totalSubmitted)}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-slate-50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي ما حصله من عملاء</p>
                                        <p className="text-xl font-black text-slate-800">{formatMoney(rep.totalCollected)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
