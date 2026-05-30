'use client';

import { createLoadingRequest, getProductsWithStock } from "@/lib/actions";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Product = {
    id: string;
    image: string | null;
    name: string;
    stock: number;
    unitsPerCarton: number;
}

type Warehouse = {
    id: string;
    name: string;
}

type Props = {
    warehouses: Warehouse[];
}

type OrderItem = {
    productId: string;
    cartons: number;
    units: number;
}

export default function LoadingRequestForm({ warehouses }: Props) {
    const [loading, setLoading] = useState(false);
    const [warehouseId, setWarehouseId] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<OrderItem[]>([{ productId: "", cartons: 0, units: 0 }]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (warehouseId) {
            getProductsWithStock(warehouseId).then(data => {
                setProducts(data as any);
            });
        } else {
            setProducts([]);
        }
    }, [warehouseId]);

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

    // Calculate total quantity for each item
    const calculateTotalQuantity = (item: OrderItem) => {
        const product = products.find(p => p.id === item.productId);
        const upc = product?.unitsPerCarton || 1;
        return (item.cartons * upc) + item.units;
    };

    // Format stock display
    const formatStock = (stock: number, upc: number) => {
        if (upc <= 1) return `${stock} قطعة`;
        const cartons = Math.floor(stock / upc);
        const units = stock % upc;
        if (cartons === 0) return `${units} قطعة`;
        return `${cartons} كرتونة ${units > 0 ? `و ${units} قطعة` : ''}`;
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);
        try {
            // Convert items to simple { productId, quantity } for the backend
            const formattedItems = items.map(item => ({
                productId: item.productId,
                quantity: calculateTotalQuantity(item)
            }));
            
            formData.append('items', JSON.stringify(formattedItems));
            const result = await createLoadingRequest(formData);
            if (result.success) {
                setMessage({ type: 'success', text: "تم إرسال طلب التحميل بنجاح في انتظار موافقة المدير" });
                setItems([{ productId: "", cartons: 0, units: 0 }]);
                setTimeout(() => router.push('/dashboard/loading-requests'), 2000);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "حدث خطأ أثناء إرسال الطلب" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
            <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 p-2 rounded-lg">📝</span>
                إنشاء طلب تحميل جديد
            </h3>

            {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    <span>{message.type === 'success' ? '✅' : '❌'}</span>
                    <p>{message.text}</p>
                </div>
            )}

            <form action={handleSubmit} className="space-y-6">
                {/* Select Warehouse */}
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">المخزن المطلوب منه</label>
                    <select 
                        name="warehouseId" 
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        required
                    >
                        <option value="">اختر المخزن...</option>
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                </div>

                {/* Note */}
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات (اختياري)</label>
                    <textarea 
                        name="note" 
                        className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none" 
                        placeholder="أدخل أي ملاحظات إضافية هنا..."
                        rows={2}
                    />
                </div>

                {/* Items List */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">قائمة الأصناف المطلوبة</label>
                        <span className="text-xs text-emerald-600 font-medium">سيتم حساب إجمالي القطع تلقائياً</span>
                    </div>
                    
                    {items.map((item, index) => {
                        const selectedProduct = products.find(p => p.id === item.productId);
                        const totalRequested = calculateTotalQuantity(item);
                        const isOverStock = selectedProduct && totalRequested > selectedProduct.stock;

                        return (
                            <div key={index} className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100 flex-wrap md:flex-nowrap">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs text-gray-500 mb-1">المنتج</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 min-w-[40px] rounded-lg bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                                            {selectedProduct?.image ? (
                                                <img src={selectedProduct.image} alt="Preview" className="w-full h-full object-cover" />
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
                                            disabled={!warehouseId}
                                        >
                                            <option value="">اختر المنتج...</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                                                    {product.name} (المتوفر: {formatStock(product.stock, product.unitsPerCarton)}) {product.stock <= 0 ? '- [منتهي]' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <div className="w-24">
                                        <label className="block text-[10px] text-gray-400 mb-1">كرتونة</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.cartons}
                                            onChange={(e) => handleItemChange(index, 'cartons', Number(e.target.value))}
                                            className="w-full border rounded-lg p-2 border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                    <span className="text-gray-300 pt-5">و</span>
                                    <div className="w-24">
                                        <label className="block text-[10px] text-gray-400 mb-1">قطعة</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.units}
                                            onChange={(e) => handleItemChange(index, 'units', Number(e.target.value))}
                                            className="w-full border rounded-lg p-2 border-gray-200 bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="min-w-[120px] text-left md:text-right">
                                    <label className="block text-[10px] text-gray-400 mb-1">إجمالي القطع</label>
                                    <div className={`text-lg font-black ${isOverStock ? 'text-red-600' : 'text-emerald-700'}`}>
                                        {totalRequested}
                                        {isOverStock && <span className="text-[10px] block text-red-500">تجاوز المتاح!</span>}
                                    </div>
                                </div>

                                <div className="flex gap-2">
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
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!warehouseId}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>➕</span> إضافة صنف آخر
                    </button>

                    <button
                        type="submit"
                        disabled={loading || !warehouseId || items.some(item => {
                            const total = calculateTotalQuantity(item);
                            const prod = products.find(p => p.id === item.productId);
                            return !item.productId || total <= 0 || (prod && total > prod.stock);
                        })}
                        className="flex-1 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-bold text-lg shadow-md disabled:bg-gray-400"
                    >
                        {loading ? 'جاري الإرسال...' : 'إرسال طلب التحميل للمدير'}
                    </button>
                </div>
            </form>
        </div>
    );
}
