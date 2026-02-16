'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
    agencies: Array<{ id: string, name: string }>;
    suppliers: Array<{ id: string, name: string, agencyId: string }>;
    createProductAction: (formData: FormData) => Promise<void>;
}

export default function CreateProductForm({ agencies, suppliers, createProductAction }: Props) {
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [unitsPerCarton, setUnitsPerCarton] = useState<number>(1);
    const [prices, setPrices] = useState({
        factory: 0,
        wholesale: 0,
        retail: 0
    });
    const router = useRouter();

    const filteredSuppliers = suppliers.filter(s => s.agencyId === selectedAgencyId);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPrices(prev => ({ ...prev, [name.replace('Price', '')]: Number(value) || 0 }));
    };

    const unitPrices = {
        factory: (prices.factory / (unitsPerCarton || 1)).toFixed(2),
        wholesale: (prices.wholesale / (unitsPerCarton || 1)).toFixed(2),
        retail: (prices.retail / (unitsPerCarton || 1)).toFixed(2)
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (existing code)
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert('حجم الصورة كبير جداً! الحد الأقصى المسموح به هو 5 ميجابايت.');
                e.target.value = '';
                setPreview(null);
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            // Append unit prices explicitly to ensure they are sent
            formData.set('unitFactoryPrice', unitPrices.factory);
            formData.set('unitWholesalePrice', unitPrices.wholesale);
            formData.set('unitRetailPrice', unitPrices.retail);

            await createProductAction(formData);
            router.refresh();
            const form = document.querySelector('form') as HTMLFormElement;
            form?.reset();
            setPreview(null);
            setPrices({ factory: 0, wholesale: 0, retail: 0 });
            setUnitsPerCarton(1);
            alert('تم إضافة المنتج بنجاح');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة المنتج');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4" dir="rtl">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                <input name="name" type="text" placeholder="مثال: بسكوت سادة" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-black text-slate-700 mb-1">التوكيل</label>
                    <select
                        name="agencyId"
                        className="w-full border-2 border-slate-100 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-bold transition-all"
                        required
                        value={selectedAgencyId}
                        onChange={(e) => setSelectedAgencyId(e.target.value)}
                    >
                        <option value="">اختر التوكيل...</option>
                        {agencies.map(agency => (
                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-black text-slate-700 mb-1">المورد</label>
                    <select
                        name="supplierId"
                        className={`w-full border-2 rounded-xl p-3 outline-none font-bold transition-all ${!selectedAgencyId ? 'bg-slate-100 border-slate-100 text-slate-400' : 'bg-slate-50 border-slate-100 focus:ring-2 focus:ring-emerald-500'}`}
                        disabled={!selectedAgencyId}
                        required
                    >
                        <option value="">{selectedAgencyId ? "اختر المورد..." : "اختر التوكيل أولاً"}</option>
                        {filteredSuppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
                    <input name="barcode" type="text" placeholder="مثال: 6223000..." className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-black text-blue-600 mb-1">عدد القطع داخل الكرتونة</label>
                    <input
                        name="unitsPerCarton"
                        type="number"
                        min="1"
                        value={unitsPerCarton}
                        onChange={(e) => setUnitsPerCarton(Number(e.target.value) || 1)}
                        className="w-full border-2 border-blue-100 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none font-black bg-blue-50/30"
                        required
                    />
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">أسعار الكرتونة (الإجمالية)</p>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 italic">سعر المصنع</label>
                        <input name="factoryPrice" type="number" onChange={handlePriceChange} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="0" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 italic">سعر الجملة</label>
                        <input name="wholesalePrice" type="number" onChange={handlePriceChange} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="0" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 italic">سعر القطاعي</label>
                        <input name="retailPrice" type="number" onChange={handlePriceChange} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="0" required />
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        أسعار القطعة (محسوبة آلياً)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-2 rounded-xl border border-blue-50 text-center">
                            <span className="block text-[9px] text-slate-400 font-bold">للمصنع</span>
                            <span className="text-sm font-black text-blue-700">{unitPrices.factory} ج.م</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-50 text-center">
                            <span className="block text-[9px] text-slate-400 font-bold">للجملة</span>
                            <span className="text-sm font-black text-blue-700">{unitPrices.wholesale} ج.م</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-blue-50 text-center">
                            <span className="block text-[9px] text-slate-400 font-bold">للقطاعي</span>
                            <span className="text-sm font-black text-blue-700">{unitPrices.retail} ج.م</span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة المنتج</label>
                {preview && (
                    <div className="mb-2 relative w-24 h-24 border-2 border-emerald-100 rounded-2xl overflow-hidden bg-gray-50 shadow-inner">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                )}
                <input
                    name="image"
                    type="file"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    accept="image/*"
                />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition disabled:opacity-50 font-black shadow-lg shadow-emerald-100 text-lg">
                {loading ? 'جاري الإضافة...' : 'حفظ المنتج الجديد'}
            </button>
        </form>
    );
}
