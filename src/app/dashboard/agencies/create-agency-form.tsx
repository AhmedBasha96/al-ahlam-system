'use client';

import { useState } from 'react';

type Prop = {
    createAgencyAction: (formData: FormData) => Promise<void>
}

export default function CreateAgencyForm({ createAgencyAction }: Prop) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

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
        // In a real app, here we would handle the file upload to storage
        // For now, the Server Action will accept the File object but just log it
        await createAgencyAction(formData);
        setLoading(false);
        setPreview(null);
        const form = document.querySelector('form') as HTMLFormElement;
        form?.reset();
        alert("تمت إضافة التوكيل بنجاح");
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم التوكيل</label>
                <input name="name" type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="مثال: توكيل سامسونج" required />
            </div>
            {/* Removed Address and Phone fields as per request */}

            {/* Image Upload Mock */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شعار التوكيل (صورة)</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full min-h-32 border-2 border-emerald-300 border-dashed rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition overflow-hidden">
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-32 object-contain" />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-4 text-emerald-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                </svg>
                                <p className="text-xs text-gray-500">اضغط لرفع صورة</p>
                            </div>
                        )}
                        <input name="image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                {loading ? 'جاري الإضافة...' : 'إضافة التوكيل'}
            </button>
        </form>
    );
}
