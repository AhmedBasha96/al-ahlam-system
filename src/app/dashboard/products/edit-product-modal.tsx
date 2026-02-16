'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
    id: string;
    name: string;
    description?: string;
    barcode?: string | null;
    factoryPrice: number;
    wholesalePrice: number;
    retailPrice: number;
    agencyId: string;
    supplierId?: string | null;
    image: string | null;
    unitsPerCarton: number;
    unitFactoryPrice: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
};

type Props = {
    product: Product;
    agencies: Array<{ id: string, name: string }>;
    suppliers: Array<{ id: string, name: string, agencyId: string }>;
    updateProductAction: (id: string, formData: FormData) => Promise<void>;
    closeModal: () => void;
};

export default function EditProductModal({ product, agencies, suppliers, updateProductAction, closeModal }: Props) {
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>(product.agencyId);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(product.image);
    const [unitsPerCarton, setUnitsPerCarton] = useState<number>(product.unitsPerCarton || 1);
    const [prices, setPrices] = useState({
        factory: product.factoryPrice,
        wholesale: product.wholesalePrice,
        retail: product.retailPrice
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
        try {
            // Explicitly set calculated unit prices
            formData.set('unitFactoryPrice', unitPrices.factory);
            formData.set('unitWholesalePrice', unitPrices.wholesale);
            formData.set('unitRetailPrice', unitPrices.retail);

            await updateProductAction(product.id, formData);
            router.refresh();
            closeModal();
            alert('تم تحديث المنتج بنجاح');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث المنتج');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in duration-200 border border-slate-100">

                <div className="bg-emerald-600 p-5 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-black text-lg">تعديل بيانات المنتج</h3>
                        <p className="text-emerald-100 text-[10px] font-bold">تحديث معلومات الوحدة والتسعير</p>
                    </div>
                    <button onClick={closeModal} className="bg-white/10 hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95">
                        ✕
                    </button>
                </div>

                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    <form action={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنتج</label>
                                <input name="name" defaultValue={product.name} type="text" className="w-full border-2 border-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold bg-slate-50/50" required />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الباركود</label>
                                <input name="barcode" defaultValue={product.barcode || ''} type="text" className="w-full border-2 border-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold bg-slate-50/50" />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-blue-600 mb-1">عدد القطع</label>
                                <input
                                    name="unitsPerCarton"
                                    type="number"
                                    min="1"
                                    value={unitsPerCarton}
                                    onChange={(e) => setUnitsPerCarton(Number(e.target.value) || 1)}
                                    className="w-full border-2 border-blue-50 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-black bg-blue-50/30"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-1">التوكيل</label>
                                <select
                                    name="agencyId"
                                    value={selectedAgencyId}
                                    onChange={(e) => setSelectedAgencyId(e.target.value)}
                                    className="w-full border-2 border-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50 font-bold transition-all"
                                    required
                                >
                                    {agencies.map(agency => (
                                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 mb-1">المورد</label>
                                <select
                                    name="supplierId"
                                    defaultValue={product.supplierId || ''}
                                    className="w-full border-2 border-slate-50 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50 font-bold transition-all"
                                    required
                                >
                                    <option value="">اختر المورد...</option>
                                    {filteredSuppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4 shadow-inner">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">التسعير بالكرتونة</p>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">المصنع</label>
                                    <input name="factoryPrice" type="number" defaultValue={product.factoryPrice} onChange={handlePriceChange} className="w-full border-2 border-white rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">الجملة</label>
                                    <input name="wholesalePrice" type="number" defaultValue={product.wholesalePrice} onChange={handlePriceChange} className="w-full border-2 border-white rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">القطاعي</label>
                                    <input name="retailPrice" type="number" defaultValue={product.retailPrice} onChange={handlePriceChange} className="w-full border-2 border-white rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm" required />
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse transition-all"></span>
                                    سعر القطعة الحالي
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-blue-50 text-center shadow-sm">
                                        <span className="block text-[9px] text-slate-400 font-bold">مصنع</span>
                                        <span className="text-xs font-black text-blue-700">{unitPrices.factory}</span>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-blue-50 text-center shadow-sm">
                                        <span className="block text-[9px] text-slate-400 font-bold">جملة</span>
                                        <span className="text-xs font-black text-blue-700">{unitPrices.wholesale}</span>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-blue-50 text-center shadow-sm">
                                        <span className="block text-[9px] text-slate-400 font-bold">قطاعي</span>
                                        <span className="text-xs font-black text-blue-700">{unitPrices.retail}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">تحديث الصورة</label>
                            <div className="flex items-center gap-4">
                                {preview && (
                                    <div className="w-20 h-20 border-2 border-emerald-50 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 shadow-sm">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <input
                                    name="image"
                                    type="file"
                                    onChange={handleImageChange}
                                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
                                    accept="image/*"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button type="submit" disabled={loading} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 font-black shadow-lg shadow-emerald-100">
                                {loading ? 'جاري الحفظ...' : 'تحديث البيانات'}
                            </button>
                            <button type="button" onClick={closeModal} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl hover:bg-slate-200 transition-all font-black">
                                تراجع
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
