'use client';

import { useState } from 'react';

type User = {
    id: string;
    username: string;
    name: string;
    role: string;
    agencyId?: string;
    pricingType?: 'WHOLESALE' | 'RETAIL';
    image: string | null;
};

type Props = {
    user: User;
    agencies: Array<{ id: string, name: string }>;
    updateUserAction: (id: string, formData: FormData) => Promise<void>;
    closeModal: () => void;
};

export default function EditUserModal({ user, agencies, updateUserAction, closeModal }: Props) {
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(user.role);
    const [preview, setPreview] = useState<string | null>(user.image);

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

    const showAgencySelect = role === 'ACCOUNTANT' || role === 'WAREHOUSE_KEEPER' || role === 'SALES_REPRESENTATIVE';

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        await updateUserAction(user.id, formData);
        setLoading(false);
        closeModal();
        alert("تم تعديل المستخدم بنجاح");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">

                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold">تعديل بيانات المستخدم</h3>
                    <button onClick={closeModal} className="hover:bg-emerald-700 w-8 h-8 flex items-center justify-center rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                            <input name="username" defaultValue={user.username} type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                            <input name="name" defaultValue={user.name} type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الصلاحية (الدور)</label>
                            <select
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="ACCOUNTANT">محاسب</option>
                                <option value="WAREHOUSE_KEEPER">أمين مخزن</option>
                                <option value="SALES_REPRESENTATIVE">مندوب مبيعات</option>
                                <option value="MANAGER">مدير توكيلات</option>
                                <option value="ADMIN">مدير النظام (Admin)</option>
                            </select>
                        </div>

                        {role === 'SALES_REPRESENTATIVE' && (
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">نظام التسعير (للمندوب)</label>
                                <select
                                    name="pricingType"
                                    defaultValue={user.pricingType || 'RETAIL'}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="RETAIL">قطاعي (الإفتراضي)</option>
                                    <option value="WHOLESALE">جملة</option>
                                </select>
                            </div>
                        )}

                        {/* Dynamic Fields */}
                        {showAgencySelect && (
                            <div className="pt-2 border-t mt-2 bg-yellow-50 p-2 rounded-lg border-yellow-100 transition-all">
                                <label className="block text-xs font-semibold text-yellow-700 mb-2">
                                    تخصيص التوكيل
                                </label>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">اختر التوكيل</label>
                                    <select name="agencyId" defaultValue={user.agencyId} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required>
                                        <option value="">اختر التوكيل...</option>
                                        {agencies.map(agency => (
                                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Image Update */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">تحديث الصورة</label>
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
