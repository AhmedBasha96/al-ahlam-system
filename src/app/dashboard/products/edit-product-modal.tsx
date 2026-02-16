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
    const router = useRouter();

    const filteredSuppliers = suppliers.filter(s => s.agencyId === selectedAgencyId);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in duration-200">

                <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold">تعديل بيانات المنتج</h3>
                    <button onClick={closeModal} className="hover:bg-emerald-700 w-8 h-8 flex items-center justify-center rounded-full transition">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <form action={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                            <input name="name" defaultValue={product.name} type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الباركود</label>
                            <input name="barcode" defaultValue={product.barcode || ''} type="text" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">التوكيل</label>
                            <select
                                name="agencyId"
                                value={selectedAgencyId}
                                onChange={(e) => setSelectedAgencyId(e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                                required
                            >
                                {agencies.map(agency => (
                                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">المورد</label>
                            <select name="supplierId" defaultValue={product.supplierId || ''} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                                <option value="">اختر المورد (اختياري)...</option>
                                {filteredSuppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                ))}
                            </select>
                        </div>



                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">سعر المصنع</label>
                                <input name="factoryPrice" defaultValue={product.factoryPrice} type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">سعر الجملة</label>
                                <input name="wholesalePrice" defaultValue={product.wholesalePrice} type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">سعر القطاعي</label>
                                <input name="retailPrice" defaultValue={product.retailPrice} type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" required />
                            </div>
                        </div>

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
