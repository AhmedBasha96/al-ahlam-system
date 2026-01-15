'use client';

import { useState } from 'react';

type Agency = {
    id: string;
    name: string;
    createdAt: Date | string;
    image: string | null;
};

type Props = {
    agency: Agency;
    updateAgencyAction: (id: string, formData: FormData) => Promise<void>;
    closeModal: () => void;
};

export default function EditAgencyModal({ agency, updateAgencyAction, closeModal }: Props) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(agency.image);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        await updateAgencyAction(agency.id, formData);
        setLoading(false);
        closeModal();
        alert("تم تعديل التوكيل بنجاح");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">

                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold">تعديل بيانات التوكيل</h3>
                    <button onClick={closeModal} className="hover:bg-emerald-700 w-8 h-8 flex items-center justify-center rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم التوكيل</label>
                            <input name="name" defaultValue={agency.name} type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                        </div>

                        {/* Image Update */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تحديث الشعار</label>
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

                        <div className="flex gap-3 mt-6">
                            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                            <button type="button" onClick={closeModal} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
