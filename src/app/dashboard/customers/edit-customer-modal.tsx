'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    customer: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
        representativeIds: string[];
        agencyId: string;
    };
    representatives: { id: string, name: string }[];
    agencies: { id: string, name: string }[];
    updateCustomerAction: (id: string, formData: FormData) => Promise<void>;
    closeModal: () => void;
};

export default function EditCustomerModal({ customer, representatives, agencies, updateCustomerAction, closeModal }: Props) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await updateCustomerAction(customer.id, formData);
            router.refresh();
            closeModal();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in duration-200">
                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold">تعديل بيانات العميل</h3>
                    <button onClick={closeModal} className="hover:bg-emerald-700 w-8 h-8 flex items-center justify-center rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل</label>
                            <input
                                name="name"
                                defaultValue={customer.name}
                                required
                                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                                <input
                                    name="phone"
                                    defaultValue={customer.phone}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                                <input
                                    name="address"
                                    defaultValue={customer.address}
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">المندوبين المسؤولين</label>
                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-40 overflow-y-auto">
                                {representatives.map(rep => (
                                    <label key={rep.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                                        <input
                                            type="checkbox"
                                            name="representativeIds"
                                            value={rep.id}
                                            defaultChecked={customer?.representativeIds?.includes(rep.id)}
                                            className="w-4 h-4 accent-emerald-600 rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">{rep.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <input type="hidden" name="agencyId" value={customer.agencyId} />

                        <div className="flex gap-3 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                            >
                                {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                            >
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
