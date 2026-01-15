'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    agencies: Array<{ id: string, name: string }>;
    createProductAction: (formData: FormData) => Promise<void>;
}

export default function CreateProductForm({ agencies, createProductAction }: Props) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            await createProductAction(formData);
            router.refresh();
            // Reset form or show success message (optional)
            const form = document.querySelector('form') as HTMLFormElement;
            form?.reset();
            setPreview(null);
            alert('تم إضافة المنتج بنجاح');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة المنتج');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                <input name="name" type="text" placeholder="مثال: بسكوت سادة" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التوكيل التابع له</label>
                <select name="agencyId" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required>
                    <option value="">اختر التوكيل...</option>
                    {agencies.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الباركود (اختياري)</label>
                <input name="barcode" type="text" placeholder="مثال: 6223000..." className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">سعر المصنع</label>
                    <input name="factoryPrice" type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">سعر الجملة</label>
                    <input name="wholesalePrice" type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">سعر القطاعي</label>
                    <input name="retailPrice" type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0" required />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة المنتج</label>
                {preview && (
                    <div className="mb-2 relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                )}
                <input
                    name="image"
                    type="file"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    accept="image/*"
                />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-bold shadow-md">
                {loading ? 'جاري الإضافة...' : 'إضافة المنتج'}
            </button>
        </form>
    );
}
