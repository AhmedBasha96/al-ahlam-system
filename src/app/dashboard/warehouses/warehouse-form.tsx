'use client';

import { createWarehouse } from "@/lib/actions";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function WarehouseForm({ agencies }: { agencies: any[] }) {
    const [name, setName] = useState('');
    const [agencyId, setAgencyId] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('agencyId', agencyId);

        startTransition(async () => {
            try {
                const result = await createWarehouse(formData);
                if (result.success) {
                    setName('');
                    setAgencyId('');
                    alert("تم إضافة المخزن بنجاح");
                    router.refresh();
                }
            } catch (error: any) {
                alert(error.message || "حدث خطأ أثناء الإضافة");
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
            <h3 className="text-lg font-bold mb-4 text-emerald-800">إضافة مخزن جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">اسم المخزن</label>
                    <input 
                        name="name" 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="مثال: مخزن القاهرة الرئيسي" 
                        required 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تابع لتوكيل</label>
                    <select 
                        name="agencyId" 
                        value={agencyId}
                        onChange={(e) => setAgencyId(e.target.value)}
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        required
                    >
                        <option value="">اختر التوكيل...</option>
                        {agencies.map((agency: any) => (
                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                        ))}
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={isPending}
                    className={`w-full ${isPending ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white py-2 rounded-lg transition font-bold`}
                >
                    {isPending ? 'جاري الإضافة...' : 'إضافة المخزن'}
                </button>
            </form>
        </div>
    );
}
