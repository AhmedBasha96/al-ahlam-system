'use client';

import { useState } from "react";
import { recordRepSubmission } from "@/lib/actions";
import { Wallet, ArrowDownCircle, CheckCircle2, History } from "lucide-react";

type Props = {
    repId: string;
    repName: string;
    custody: number;
}

export default function RepCustodyManager({ repId, repName, custody }: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");

    async function handleSubmit() {
        if (!amount || Number(amount) <= 0) return;
        setLoading(true);
        try {
            const result = await recordRepSubmission(repId, Number(amount), note || `تصفية عهدة نقدية للمندوب: ${repName}`);
            if (result.success) {
                setAmount("");
                setNote("");
                setIsSubmitting(false);
                // Refreshing is usually handled by revalidatePath in the server action
                window.location.reload();
            } else {
                alert("خطأ في تسجيل التوريد: " + (result as any).error);
            }
        } catch (error) {
            alert("خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">العهدة النقدية (تحصيلات في ذمة المندوب)</p>
                        <p className={`text-2xl font-black ${custody > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {custody.toLocaleString()} ج.م
                        </p>
                    </div>
                </div>

                {!isSubmitting ? (
                    <button
                        onClick={() => setIsSubmitting(true)}
                        disabled={custody <= 0}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 disabled:grayscale"
                    >
                        <ArrowDownCircle className="w-5 h-5" />
                        توريد عهدة للخزينة
                    </button>
                ) : (
                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-2">
                        <div className="relative w-full sm:w-32">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="المبلغ"
                                className="w-full border-2 border-emerald-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-all font-bold"
                            />
                        </div>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="ملاحظات (اختياري)"
                            className="w-full sm:w-48 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-emerald-500 transition-all"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !amount}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all"
                            >
                                {loading ? "..." : <CheckCircle2 className="w-4 h-4" />}
                                تأكيد التوريد
                            </button>
                            <button
                                onClick={() => setIsSubmitting(false)}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
