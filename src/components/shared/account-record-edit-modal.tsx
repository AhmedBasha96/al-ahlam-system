'use client';

import { useState } from "react";

type Props = {
    id: string;
    amount: number;
    description: string;
    category?: string | null;
    date?: Date | string;
    type: 'INCOME' | 'EXPENSE';
    agencyName?: string;
    onUpdate: (id: string, updates: { amount?: number; description?: string; category?: string }) => Promise<any>;
    onClose: () => void;
};

export default function AccountRecordEditModal({
    id,
    amount: initialAmount,
    description: initialDescription,
    category: initialCategory,
    date,
    type,
    agencyName,
    onUpdate,
    onClose
}: Props) {
    const [amount, setAmount] = useState(initialAmount);
    const [description, setDescription] = useState(initialDescription);
    const [category, setCategory] = useState(initialCategory || '');
    const [saving, setSaving] = useState(false);

    const isIncome = type === 'INCOME';
    const title = isIncome ? 'تعديل إيراد' : 'تعديل مصروف';
    const accentColor = isIncome ? 'emerald' : 'orange';

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(id, { amount, description, category: category || undefined });
            alert("تم حفظ التعديلات بنجاح ✅");
            onClose();
        } catch (error) {
            alert("خطأ في الحفظ: " + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-lg animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className={`bg-slate-900 p-6 flex justify-between items-center text-white`}>
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <span className="p-2 bg-white/10 rounded-xl">
                            {isIncome ? '📥' : '📤'}
                        </span>
                        {title}
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/10 w-10 h-10 flex items-center justify-center rounded-xl transition font-bold">
                        ✕
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Info */}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>📅 {date ? new Date(date).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                        {agencyName && <span>🏢 {agencyName}</span>}
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">المبلغ</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                            className={`w-full border-2 border-${accentColor}-200 rounded-2xl p-4 text-2xl font-black text-${accentColor}-700 outline-none focus:ring-4 focus:ring-${accentColor}-100 transition-all`}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">البيان</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-2xl p-4 text-lg font-bold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">التصنيف</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-2xl p-4 text-lg font-bold text-slate-700 outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                            placeholder="اختياري..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 font-bold px-6 py-2 transition"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition shadow-xl shadow-slate-200 disabled:opacity-50"
                        >
                            {saving ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
