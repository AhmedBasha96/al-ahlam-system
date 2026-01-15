'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    representatives: { id: string, name: string }[];
    agencies: { id: string, name: string }[];
    createCustomerAction: (formData: FormData) => Promise<void>;
    userRole?: string;
    userAgencyId?: string;
};

export default function CreateCustomerForm({ representatives, agencies, createCustomerAction, userRole, userAgencyId }: Props) {
    const isRep = userRole === 'SALES_REPRESENTATIVE';
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            try {
                await createCustomerAction(formData);
                e.currentTarget.reset();
                router.refresh();
            } catch (error) {
                alert(error instanceof Error ? error.message : 'حدث خطأ ما');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل</label>
                <input
                    name="name"
                    required
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="مثلاً: سوبر ماركت الهدى"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                    <input
                        name="phone"
                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="010..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                    <input
                        name="address"
                        className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="المنطقة..."
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">المندوبين المسؤولين (اختر واحد أو أكثر)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                    {representatives.map(rep => (
                        <label key={rep.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-emerald-100">
                            <input
                                type="checkbox"
                                name="representativeIds"
                                value={rep.id}
                                className="w-5 h-5 accent-emerald-600 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">{rep.name}</span>
                        </label>
                    ))}
                </div>
                {representatives.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">لا يوجد مناديب متاحين حالياً</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">التوكيل / الشركة</label>
                <select
                    name="agencyId"
                    required
                    defaultValue={isRep ? userAgencyId : ""}
                    disabled={isRep && !!userAgencyId}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                    <option value="">اختر التوكيل...</option>
                    {agencies.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                </select>
                {isRep && userAgencyId && (
                    <input type="hidden" name="agencyId" value={userAgencyId} />
                )}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-md disabled:opacity-50 mt-2"
            >
                {isPending ? 'جاري الإضافة...' : 'حفظ العميل'}
            </button>
        </form>
    );
}
