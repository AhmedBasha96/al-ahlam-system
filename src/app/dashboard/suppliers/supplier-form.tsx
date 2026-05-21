'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupplier, updateSupplier } from '@/lib/actions/suppliers';

type Props = {
    agencies: Array<{ id: string, name: string }>;
    initialAgencyId?: string;
    supplier?: {
        id: string;
        name: string;
        phone: string | null;
        address: string | null;
        agencyId: string;
    };
    onSuccess?: () => void;
}

export default function SupplierForm({ agencies, initialAgencyId, supplier, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            if (supplier) {
                await updateSupplier(supplier.id, formData);
                alert('تم تحديث بيانات المورد بنجاح');
            } else {
                await createSupplier(formData);
                alert('تم إضافة المورد بنجاح');
            }
            router.refresh();
            if (onSuccess) onSuccess();
            if (!supplier) {
                const form = document.querySelector('form') as HTMLFormElement;
                form?.reset();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4 text-right" dir="rtl">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المورد</label>
                <input
                    name="name"
                    defaultValue={supplier?.name}
                    type="text"
                    placeholder="اسم الشركة أو المورد"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                />
            </div>

            {!supplier && !initialAgencyId ? (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">التوكيل التابع له</label>
                    <select name="agencyId" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="">اختر التوكيل...</option>
                        {agencies.map(agency => (
                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                        ))}
                    </select>
                </div>
            ) : initialAgencyId && !supplier ? (
                <input type="hidden" name="agencyId" value={initialAgencyId} />
            ) : null}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                    name="phone"
                    defaultValue={supplier?.phone || ''}
                    type="text"
                    placeholder="رقم الهاتف"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <textarea
                    name="address"
                    defaultValue={supplier?.address || ''}
                    placeholder="العنوان"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-bold shadow-md"
            >
                {loading ? 'جاري الحفظ...' : supplier ? 'تحديث البيانات' : 'إضافة مورد جديد'}
            </button>
        </form>
    );
}
