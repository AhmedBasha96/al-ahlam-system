'use client';

import { useState } from "react";
import { resetAllData } from "@/lib/actions";
import { Trash2, AlertCircle, RefreshCcw } from "lucide-react";

export default function ResetDataButton() {
    const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle');

    const handleReset = async () => {
        setStep('loading');
        try {
            await resetAllData();
            alert("تم تصفير كافة البيانات بنجاح!");
            window.location.reload();
        } catch (error) {
            alert("حدث خطأ أثناء تصفير البيانات");
            setStep('idle');
        }
    };

    if (step === 'loading') {
        return (
            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-2 rounded-lg font-bold">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                جاري تصفير البيانات...
            </div>
        );
    }

    if (step === 'confirm') {
        return (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-2 rounded-xl">
                <span className="text-xs font-bold text-red-700 mx-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    هل أنت متأكد؟ سيتم مسح كافة الفواتير والمنتجات والعملاء!
                </span>
                <button
                    onClick={handleReset}
                    className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm"
                >
                    نعم، امسح الكل
                </button>
                <button
                    onClick={() => setStep('idle')}
                    className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-300"
                >
                    إلغاء
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setStep('confirm')}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition font-bold text-sm border border-red-100"
        >
            <Trash2 className="w-4 h-4" />
            تصفير كافة بيانات النظام
        </button>
    );
}
