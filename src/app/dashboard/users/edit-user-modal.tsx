'use client';

import { resetUserPassword } from '@/lib/actions';
import { useState } from 'react';

type User = {
    id: string;
    username: string;
    name: string;
    role: string;
    agencyId?: string;
    agencyIds?: string[];
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

    const [newPassword, setNewPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);

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
        try {
            await updateUserAction(user.id, formData);
            alert("تم تعديل بيانات المستخدم بنجاح");
            closeModal();
        } catch (error) {
            alert("خطأ في التعديل");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;

        setResetLoading(true);
        try {
            const formData = new FormData();
            formData.append("password", newPassword);

            const result = await resetUserPassword(user.id, formData);

            if (result.success) {
                alert("تم تغيير كلمة المرور بنجاح");
                setNewPassword("");
            } else {
                alert((result as any).error || "خطأ في تغيير كلمة المرور");
            }
        } catch (error) {
            alert("خطأ في تغيير كلمة المرور");
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 overflow-hidden relative animate-in fade-in zoom-in duration-200">

                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white sticky top-0 z-10">
                    <h3 className="font-bold text-lg">تعديل المستخدم: {user.name}</h3>
                    <button onClick={closeModal} className="hover:bg-emerald-700 w-8 h-8 flex items-center justify-center rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Main Info Form */}
                    <form action={handleSubmit} className="space-y-4">
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2">البيانات الأساسية</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                            <input name="username" defaultValue={user.username} type="text" className="w-full border-2 border-slate-100 rounded-xl p-2.5 focus:border-emerald-500 outline-none transition-all" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                            <input name="name" defaultValue={user.name} type="text" className="w-full border-2 border-slate-100 rounded-xl p-2.5 focus:border-emerald-500 outline-none transition-all" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الصلاحية (الدور)</label>
                            <select
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full border-2 border-slate-100 rounded-xl p-2.5 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
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
                                    className="w-full border-2 border-slate-100 rounded-xl p-2.5 focus:border-emerald-500 outline-none transition-all"
                                >
                                    <option value="RETAIL">قطاعي (إفتراضي)</option>
                                    <option value="WHOLESALE">جملة</option>
                                </select>
                            </div>
                        )}

                        {/* Dynamic Fields */}
                        {showAgencySelect && (
                            <div className="pt-2 border-t mt-2 bg-yellow-50/50 p-4 rounded-2xl border border-yellow-100 transition-all">
                                <label className="block text-xs font-black text-yellow-800 mb-3 uppercase tracking-wider">
                                    تخصيص التوكيلات
                                    <span className="mr-2 text-[10px] font-medium text-yellow-600">(يمكن اختيار أكثر من توكيل)</span>
                                </label>

                                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {agencies.map(agency => {
                                        const isChecked = user.agencyIds?.includes(agency.id) || user.agencyId === agency.id;
                                        return (
                                            <label key={agency.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition-all border border-transparent hover:border-yellow-200">
                                                <input
                                                    type="checkbox"
                                                    name="agencyId"
                                                    value={agency.id}
                                                    defaultChecked={isChecked}
                                                    className="w-5 h-5 text-emerald-600 rounded-lg border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                                />
                                                <span className="text-sm font-bold text-slate-700">{agency.name}</span>
                                            </label>
                                        );
                                    })}
                                    {agencies.length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-2 italic font-medium">لا توجد توكيلات متاحة</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Image Update */}
                        <div className="pt-4 border-t border-slate-50">
                            <label className="block text-sm font-medium text-gray-700 mb-2">تحديث صورة الحساب</label>
                            <div className="flex items-center gap-4">
                                {preview && (
                                    <div className="relative w-16 h-16 border-2 border-emerald-100 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <input
                                    name="image"
                                    type="file"
                                    onChange={handleImageChange}
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50">
                                {loading ? 'جاري الحفظ...' : 'حفظ البيانات الأساسية'}
                            </button>
                        </div>
                    </form>

                    {/* Password Reset Section - Only for Admins */}
                    <div className="pt-8 border-t-2 border-dashed border-slate-100">
                        <p className="text-xs font-black text-rose-600 uppercase tracking-widest border-b border-rose-50 pb-2 mb-4">أمان الحساب (تغيير كلمة المرور)</p>
                        <form onSubmit={handlePasswordReset} className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="كلمة المرور الجديدة"
                                className="flex-1 border-2 border-slate-100 rounded-xl p-2.5 focus:border-rose-400 outline-none transition-all text-sm font-mono"
                                required
                            />
                            <button
                                type="submit"
                                disabled={resetLoading || !newPassword}
                                className="bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-600 transition-all disabled:opacity-50 shadow-md shadow-rose-100 flex-shrink-0"
                            >
                                {resetLoading ? 'جاري التغيير...' : 'تحديث المرور'}
                            </button>
                        </form>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* سيتم تغيير كلمة المرور للمستخدم فوراً عند الضغط على التحديث.</p>
                    </div>

                    <div className="pt-4">
                        <button type="button" onClick={closeModal} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">
                            إغلاق النافذة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
