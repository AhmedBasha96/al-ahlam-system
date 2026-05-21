'use client';

import { useState, useEffect } from "react";

type Product = {
    id: string;
    name: string;
    wholesalePrice: number;
    unitWholesalePrice: number;
    unitsPerCarton: number;
    stocks: { warehouseId: string; quantity: number }[];
};

type Warehouse = {
    id: string;
    name: string;
};

type SelectedItem = {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    availableStock: number;
};

export default function ReturnRequestModal({
    supplierId,
    supplierName,
    products,
    warehouses,
    onClose,
    onSubmit
}: {
    supplierId: string;
    supplierName: string;
    products: Product[];
    warehouses: Warehouse[];
    onClose: () => void;
    onSubmit: (warehouseId: string, items: { productId: string; quantity: number; price: number }[], total: number) => Promise<void>;
}) {
    const [warehouseId, setWarehouseId] = useState("");
    const [items, setItems] = useState<SelectedItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Add item form state
    const [selectedProductId, setSelectedProductId] = useState("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [price, setPrice] = useState<number | "">("");

    const selectedProduct = products.find(p => p.id === selectedProductId);

    // Calculate available stock based on selected warehouse and product
    const availableStock = selectedProduct && warehouseId
        ? selectedProduct.stocks.find(s => s.warehouseId === warehouseId)?.quantity || 0
        : 0;

    // Default price to product's wholesale price (approximate cost)
    useEffect(() => {
        if (selectedProduct) {
            setPrice(Number(selectedProduct.wholesalePrice) || 0);
        }
    }, [selectedProductId, selectedProduct]);

    const handleAddItem = () => {
        if (!selectedProduct || !quantity || !price || !warehouseId) return;

        if (Number(quantity) > availableStock) {
            alert(`الكمية المطلوبة (${quantity}) أكبر من المتاح في المخزن (${availableStock})`);
            return;
        }

        const exactTotal = Number(quantity) * Number(price);

        const newItem: SelectedItem = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: Number(quantity),
            price: Number(price),
            availableStock
        };

        setItems([...items, newItem]);
        setSelectedProductId("");
        setQuantity("");
        setPrice("");
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const handleSubmit = async () => {
        if (!warehouseId || items.length === 0) return;
        setLoading(true);
        try {
            await onSubmit(
                warehouseId,
                items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount
            );
            onClose();
        } catch (error: any) {
            alert("حدث خطأ أثناء تقديم الطلب: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl p-6 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-rose-600 flex items-center gap-2">
                            <span>📦</span> طلب إرجاع بضاعة للمصنع
                        </h2>
                        <p className="text-slate-500 font-bold mt-1">المورد: {supplierName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Warehouse Selection */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="block text-sm font-black text-slate-700 mb-2">من مخزن / عهدة:</label>
                        <select
                            value={warehouseId}
                            onChange={(e) => {
                                setWarehouseId(e.target.value);
                                setItems([]); // Clear items when warehouse changes to prevent invalid stock
                            }}
                            className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-rose-500 font-bold"
                        >
                            <option value="" disabled>-- اختر المخزن --</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-rose-500 font-bold mt-2">ملاحظة: تغيير المخزن سيمسح قائمة الأصناف المضافة.</p>
                    </div>

                    {/* Add Item Form */}
                    <div className="flex gap-4 items-end bg-white p-4 rounded-xl border-2 border-slate-100 shadow-sm">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1">الصنف</label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                disabled={!warehouseId}
                                className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 font-bold text-sm"
                            >
                                <option value="" disabled>اختر صنفاً...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {selectedProductId && warehouseId && (
                                <p className="text-[11px] font-black text-emerald-600 mt-1">
                                    المتاح بالمخزن: {availableStock} كرتونة
                                </p>
                            )}
                        </div>

                        <div className="w-24">
                            <label className="block text-xs font-bold text-slate-500 mb-1">الكمية</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                disabled={!selectedProductId}
                                max={availableStock}
                                className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 font-bold text-center"
                            />
                        </div>

                        <div className="w-32">
                            <label className="block text-xs font-bold text-slate-500 mb-1">سعر المرتجع</label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                disabled={!selectedProductId}
                                className="w-full border-2 border-slate-200 rounded-lg p-3 outline-none focus:border-indigo-500 font-bold text-center"
                            />
                        </div>

                        <button
                            onClick={handleAddItem}
                            disabled={!selectedProductId || !quantity || quantity <= 0 || !price || quantity > availableStock}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold p-3 rounded-lg transition h-[52px] px-6"
                        >
                            إضافة +
                        </button>
                    </div>

                    {/* Items List */}
                    {items.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-right">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-black">
                                    <tr>
                                        <th className="p-3">الصنف</th>
                                        <th className="p-3 w-20 text-center">الكمية</th>
                                        <th className="p-3 w-32 text-center">السعر</th>
                                        <th className="p-3 w-32 text-center">الإجمالي</th>
                                        <th className="p-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition">
                                            <td className="p-3 font-bold text-slate-800 text-sm">{item.productName}</td>
                                            <td className="p-3 text-center font-black text-rose-600">{item.quantity}</td>
                                            <td className="p-3 text-center font-bold text-slate-600">{item.price}</td>
                                            <td className="p-3 text-center font-black text-slate-900">
                                                {(item.quantity * item.price).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => removeItem(idx)} className="text-rose-500 hover:bg-rose-100 p-2 rounded-lg transition">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-50">
                                        <td colSpan={3} className="p-4 text-left font-black text-slate-500">الإجمالي الكلي:</td>
                                        <td className="p-4 text-center font-black text-2xl text-rose-600">
                                            {totalAmount.toLocaleString()} ج.م
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition">
                        إلغاء التعديل
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={items.length === 0 || loading || !warehouseId}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-slate-200 transition flex items-center gap-2"
                    >
                        {loading ? 'جاري الإرسال...' : 'إرسال طلب المرتجع للاعتماد 🚀'}
                    </button>
                </div>
            </div>
        </div>
    );
}
