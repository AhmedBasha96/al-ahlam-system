'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Prop = {
    agencies: Array<{ id: string, name: string }>
    createUserAction: (formData: FormData) => Promise<void>
}

export default function CreateUserForm({ agencies, createUserAction }: Prop) {
    const [role, setRole] = useState('ACCOUNTANT');
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

    const showAgencySelect = role === 'ACCOUNTANT' || role === 'WAREHOUSE_KEEPER' || role === 'SALES_REPRESENTATIVE';

    const handleSubmit = async (formData: FormData) => {
        try {
            setLoading(true);
            await createUserAction(formData);
            setLoading(false);
            setPreview(null);
            const form = document.querySelector('form') as HTMLFormElement;
            form?.reset();
            setRole('ACCOUNTANT'); // Reset role to default
            alert("تمت إضافة المستخدم بنجاح");
            router.refresh();
        } catch (error) {
            setLoading(false);
            console.error('Error creating user:', error);
            alert(`خطأ في إضافة المستخدم: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم</label>
                <input name="username" type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="الاسم" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input name="name" type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="الاسم الكامل" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input name="password" type="password" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="********" required />
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

            {/* Dynamic Fields */}
            {showAgencySelect && (
                <div className="pt-2 border-t mt-2 bg-yellow-50 p-3 rounded-lg border-yellow-100 transition-all">
                    <label className="block text-xs font-semibold text-yellow-700 mb-2">
                        {role === 'ACCOUNTANT' ? 'تخصيص التوكيلات للمحاسب' :
                            role === 'WAREHOUSE_KEEPER' ? 'تخصيص التوكيلات لأمين المخزن' :
                                'تخصيص التوكيلات للمندوب'}
                        <span className="mr-1 text-[10px] font-normal">(يمكن اختيار أكثر من توكيل)</span>
                    </label>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {agencies.map(agency => (
                            <label key={agency.id} className="flex items-center gap-2 p-2 rounded hover:bg-yellow-100 cursor-pointer transition">
                                <input
                                    type="checkbox"
                                    name="agencyId"
                                    value={agency.id}
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-700">{agency.name}</span>
                            </label>
                        ))}
                        {agencies.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">لا توجد توكيلات متاحة</p>
                        )}
                    </div>
                </div>
            )}

            {role === 'SALES_REPRESENTATIVE' && (
                <div className="pt-2 border-t mt-2 bg-blue-50 p-2 rounded-lg border-blue-100 transition-all">
                    <label className="block text-xs font-semibold text-blue-700 mb-2">
                        إعدادات المندوب (نوع التعامل)
                    </label>
                    <select name="pricingType" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required>
                        <option value="RETAIL">قطاعي (الإفتراضي)</option>
                        <option value="WHOLESALE">جملة</option>
                    </select>
                </div>
            )}

            {/* Image Upload Mock */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة المستخدم</label>
                <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full min-h-24 border-2 border-emerald-300 border-dashed rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition overflow-hidden">
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full h-24 object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                <p className="text-xs text-gray-500">اضغط لرفع صورة</p>
                            </div>
                        )}
                        <input name="image" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50">
                {loading ? 'جاري الإضافة...' : 'إضافة المستخدم'}
            </button>
        </form>
    );
}
