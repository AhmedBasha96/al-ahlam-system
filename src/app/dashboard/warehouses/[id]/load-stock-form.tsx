'use client';

import { loadStockToRep } from "@/lib/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
    id: string;
    image: string | null;
    name: string;
    wholesalePrice: number;
    factoryPrice: number;
    unitsPerCarton: number;
}

type User = {
    id: string;
    name: string;
    role: string;
}

type Props = {
    warehouseId: string;
    products: Product[];
    reps: User[];
}

type OrderItem = {
    productId: string;
    cartons: number;
    units: number;
}

export default function LoadStockForm({ warehouseId, products, reps }: Props) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<OrderItem[]>([{ productId: "", cartons: 0, units: 0 }]);
    const router = useRouter();

    const handleAddItem = () => {
        setItems([...items, { productId: "", cartons: 0, units: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            // Calculate total quantities based on unitsPerCarton
            const processedItems = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const unitsPerCarton = product?.unitsPerCarton || 1;
                const totalUnits = (item.cartons * unitsPerCarton) + item.units;
                return {
                    productId: item.productId,
                    quantity: totalUnits
                };
            }).filter(item => item.quantity > 0);

            if (processedItems.length === 0) throw new Error("يرجى إدخال كميات صحيحة");

            // Append items as JSON string to FormData
            formData.append('items', JSON.stringify(processedItems));

            await loadStockToRep(formData);
            router.refresh();
            alert("تم تحميل البضاعة بنجاح");
            setItems([{ productId: "", cartons: 0, units: 0 }]); // Reset form
        } catch (error) {
            alert(error instanceof Error ? error.message : "حدث خطأ أثناء التحميل");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 mt-8">
            <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 p-2 rounded-lg">🚚</span>
                إذن صرف مخزني (تحميل مندوب)
            </h3>

            <form action={handleSubmit} className="space-y-6">
                <input type="hidden" name="warehouseId" value={warehouseId} />

                {/* Select Rep */}
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">المندوب</label>
                    <select name="repId" className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none" required>
                        <option value="">اختر المندوب...</option>
                        {reps.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                        ))}
                    </select>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">قائمة الأصناف</label>
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">المنتج</label>
                                <div className="flex gap-3 items-center">
                                    <div className="w-10 h-10 min-w-[40px] rounded-lg bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                                        {item.productId && products.find(p => p.id === item.productId)?.image ? (
                                            <img src={products.find(p => p.id === item.productId)!.image!} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-200">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                    <select
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        required
                                    >
                                        <option value="">اختر المنتج...</option>
                                        {products.map(product => (
                                            <option key={product.id} value={product.id}>{product.name}</option>
                                        ))}
                                    </select>

                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="w-24">
                                    <label className="block text-[10px] text-gray-500 mb-1">كرتونة</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.cartons}
                                        onChange={(e) => handleItemChange(index, 'cartons', Number(e.target.value))}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold bg-white"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-[10px] text-gray-500 mb-1">علبة</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.units}
                                        onChange={(e) => handleItemChange(index, 'units', Number(e.target.value))}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold bg-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition"
                                    title="حذف الصنف"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                    >
                        <span>➕</span> إضافة صنف آخر
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-bold"
                    >
                        {loading ? 'جاري التحميل...' : 'تأكيد وصرف البضاعة'}
                    </button>
                </div>
            </form>
        </div>
    );
}
