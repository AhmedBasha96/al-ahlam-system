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
    quantity: number;
}

export default function LoadStockForm({ warehouseId, products, reps }: Props) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<OrderItem[]>([{ productId: "", quantity: 1 }]);
    const router = useRouter();

    const handleAddItem = () => {
        setItems([...items, { productId: "", quantity: 1 }]);
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
            // Append items as JSON string to FormData
            formData.append('items', JSON.stringify(items));

            await loadStockToRep(formData);
            router.refresh();
            alert("تم تحميل البضاعة بنجاح");
            setItems([{ productId: "", quantity: 1 }]); // Reset form
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
                                    {item.productId && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            سعر المصنع: {products.find(p => p.id === item.productId)?.factoryPrice?.toLocaleString('en-US') || '-'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="w-32">
                                <label className="block text-xs text-gray-500 mb-1">الكمية</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                                    placeholder="0"
                                    required
                                />
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
