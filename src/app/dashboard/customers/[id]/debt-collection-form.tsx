'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordDebtCollection } from "@/lib/actions";

type Props = {
    customerId: string;
    customerName: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function DebtCollectionForm({ customerId, customerName, onSuccess, onCancel }: Props) {
    const [amount, setAmount] = useState<number>(0);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0) {
            alert("يرجى إدخال مبلغ صحيح");
            return;
        }

        setLoading(true);
        try {
            const result = await recordDebtCollection(customerId, amount, note);
            if (result.success) {
                alert("تم تسجيل التحصيل بنجاح");
                setAmount(0);
                setNote("");
                router.refresh();
                if (onSuccess) onSuccess();
            } else {
                alert(`خطأ: ${result.error}`);
            }
        } catch (error) {
            alert("حدث خطأ أثناء الاتصال بالخادم");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-emerald-100 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 p-2 rounded-xl">💰</span>
                تحصيل مديونية - {customerName}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ المحصل (ج.م)</label>
                    <input
                        type="number"
                        value={amount || ""}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full border-2 border-emerald-50 rounded-xl p-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-black text-2xl text-emerald-700"
                        placeholder="0.00"
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border-2 border-emerald-50 rounded-xl p-3 focus:border-emerald-500 outline-none text-sm h-24"
                        placeholder="أدخل أي ملاحظات إضافية هنا..."
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                    >
                        {loading ? 'جاري الحفظ...' : 'تأكيد التحصيل'}
                    </button>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                        >
                            إلغاء
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
