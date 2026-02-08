'use client';

import { useState } from "react";
import { recordAgencyPayment } from "@/lib/actions";
import { Wallet, Send, Loader2 } from "lucide-react";

interface AgencyPaymentFormProps {
    agencyId: string;
    agencyName: string;
}

export default function AgencyPaymentForm({ agencyId, agencyName }: AgencyPaymentFormProps) {
    const [amount, setAmount] = useState<string>("");
    const [note, setNote] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert("يرجى إدخال مبلغ صحيح");
            return;
        }

        setIsLoading(true);
        try {
            const result = await recordAgencyPayment(agencyId, numAmount, note);
            if (result.success) {
                setAmount("");
                setNote("");
                setIsOpen(false);
            } else {
                alert("خطأ: " + result.error);
            }
        } catch (error) {
            alert("حدث خطأ غير متوقع");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
            >
                <Wallet className="w-4 h-4" />
                تسجيل سداد مديونية توريد
            </button>
        );
    }

    return (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    سداد لـ {agencyName}
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-bold"
                >
                    إغاء
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-emerald-700 mb-1">المبلغ المسدد</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-emerald-700 mb-1">ملاحظات (اختياري)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-white border border-emerald-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="مثلاً: دفعة تحت الحساب"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition shadow-md"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            جاري التسجيل...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            تأكيد السداد
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
