'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplierReturnRequest } from "@/lib/actions/suppliers";

type Product = {
    id: string;
    name: string;
    image: string | null;
    wholesalePrice: number;
    retailPrice: number;
    factoryPrice: number;
    unitsPerCarton: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
    unitFactoryPrice: number;
    agencyId: string;
    supplier?: { id: string, name: string };
}

type Stock = {
    warehouseId: string;
    productId: string;
    quantity: number;
}

type Props = {
    warehouseId: string;
    products: Product[];
    stocks: Stock[];
}

type OrderItem = {
    productId: string;
    cartons: number;
    units: number;
    price: number;
}

export default function WarehouseReturnForm({ warehouseId, products, stocks }: Props) {
    const [loading, setLoading] = useState(false);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
    const [items, setItems] = useState<OrderItem[]>([{ productId: "", cartons: 0, units: 0, price: 0 }]);
    const router = useRouter();

    // Extract unique suppliers from products
    const suppliersMap = new Map<string, { id: string, name: string }>();
    products.forEach(p => {
        if (p.supplier && p.supplier.id) {
            suppliersMap.set(p.supplier.id, p.supplier);
        }
    });
    const suppliers = Array.from(suppliersMap.values());

    // Filter products by selected supplier
    const supplierProducts = products.filter(p => p.supplier?.id === selectedSupplierId);

    const handleAddItem = () => {
        setItems([...items, { productId: "", cartons: 0, units: 0, price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        let newItem = { ...newItems[index], [field]: value };

        // 1. Reset quantities if product changes
        if (field === 'productId') {
            newItem.cartons = 0;
            newItem.units = 0;
        }

        const product = supplierProducts.find(p => p.id === newItem.productId);
        const upc = product?.unitsPerCarton || 1;

        // Smart Rebalancing
        if (field === 'units' && value >= upc && upc > 0) {
            newItem.cartons += Math.floor(value / upc);
            newItem.units = value % upc;
        }

        // 2. Auto-set default price based on the FINAL quantities
        if (product) {
            if (newItem.cartons > 0) {
                newItem.price = Number(product.factoryPrice);
            } else {
                newItem.price = Number(product.unitFactoryPrice);
            }
        }

        newItems[index] = newItem;
        setItems(newItems);
    };

    const totalAmount = items.reduce((sum, item) => {
        const product = supplierProducts.find(p => p.id === item.productId);
        const upc = product?.unitsPerCarton || 1;

        let itemTotal = 0;
        if (item.cartons > 0) {
            const effectiveCartons = item.cartons + (item.units / upc);
            itemTotal = effectiveCartons * item.price;
        } else {
            itemTotal = item.units * item.price;
        }
        return sum + itemTotal;
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSupplierId) {
            alert("يرجى اختيار المورد");
            return;
        }

        setLoading(true);
        try {
            const processedItems = items.map(item => {
                const product = supplierProducts.find(p => p.id === item.productId);
                const upc = product?.unitsPerCarton || 1;

                let totalUnits = 0;
                let unitPrice = 0;

                if (item.cartons > 0) {
                    totalUnits = (item.cartons * upc) + item.units;
                    unitPrice = item.price / upc;
                } else {
                    totalUnits = item.units;
                    unitPrice = item.price;
                }

                return {
                    productId: item.productId,
                    quantity: totalUnits,
                    price: unitPrice
                };
            }).filter(item => item.quantity > 0);

            if (processedItems.length === 0) throw new Error("يرجى إدخال كميات صحيحة");

            // Validate against stock
            for (const item of processedItems) {
                const stock = stocks.find(s => s.productId === item.productId && s.warehouseId === warehouseId);
                const qtyAvailable = stock?.quantity || 0;
                if (item.quantity > qtyAvailable) {
                    const product = supplierProducts.find(p => p.id === item.productId);
                    throw new Error(`الكمية المطلوبة من ${product?.name} (${item.quantity}) أكبر من المتاح في المخزن (${qtyAvailable})`);
                }
            }

            await createSupplierReturnRequest(
                selectedSupplierId,
                warehouseId,
                processedItems,
                totalAmount
            );

            router.refresh();
            alert("تم إرسال طلب المرتجع بنجاح وفي انتظار اعتماد الحسابات");

            // Reset form
            setItems([{ productId: "", cartons: 0, units: 0, price: 0 }]);
            setSelectedSupplierId("");
        } catch (error) {
            alert(error instanceof Error ? error.message : "حدث خطأ أثناء إرسال المرتجع");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-6 mt-8">
            <h3 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
                <span className="bg-rose-100 p-2 rounded-lg">🔙</span>
                طلب مرتجع للمصنع (انتظار الاعتماد)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Select Supplier */}
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">المصنع / المورد</label>
                    <select
                        value={selectedSupplierId}
                        onChange={(e) => {
                            setSelectedSupplierId(e.target.value);
                            setItems([{ productId: "", cartons: 0, units: 0, price: 0 }]);
                        }}
                        className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-rose-500 outline-none font-bold text-rose-700"
                        required
                    >
                        <option value="">اختر المورد...</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                    </select>
                </div>

                {/* Items List */}
                {selectedSupplierId && (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">تحديد الأصناف للمرتجع</label>
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-rose-50/30 p-4 rounded-lg border border-rose-100">
                                <div className="flex-1 min-w-[250px]">
                                    <label className="block text-xs text-gray-500 mb-1">المنتج</label>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 min-w-[40px] rounded-lg bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                                            {item.productId && supplierProducts.find(p => p.id === item.productId)?.image ? (
                                                <img src={supplierProducts.find(p => p.id === item.productId)!.image!} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-gray-200">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none bg-white font-bold"
                                            required
                                        >
                                            <option value="">اختر المنتج...</option>
                                            {supplierProducts.map(product => {
                                                const stock = stocks.find(s => s.productId === product.id && s.warehouseId === warehouseId);
                                                const qty = stock?.quantity || 0;
                                                const upc = product.unitsPerCarton || 1;
                                                const cartons = Math.floor(qty / upc);
                                                const units = qty % upc;

                                                // Only show products that have stock > 0
                                                if (qty <= 0) return null;

                                                return (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} (بالمخزن: {cartons} ك + {units} ع)
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <div className="w-20">
                                        <label className="block text-[10px] text-gray-500 mb-1">كرتونة</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.cartons}
                                            onChange={(e) => handleItemChange(index, 'cartons', Number(e.target.value))}
                                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none text-center font-bold bg-white"
                                            placeholder="0"
                                            disabled={!item.productId}
                                        />
                                    </div>
                                    <div className="w-20">
                                        <label className="block text-[10px] text-gray-500 mb-1">علبة</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.units}
                                            onChange={(e) => handleItemChange(index, 'units', Number(e.target.value))}
                                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none text-center font-bold bg-white"
                                            placeholder="0"
                                            disabled={!item.productId}
                                        />
                                    </div>

                                    <div className="w-32">
                                        <label className="block text-[10px] text-gray-500 mb-1">السعر ({item.cartons > 0 ? 'للكرتونة' : 'للقطعة'})</label>
                                        <input
                                            type="number"
                                            value={item.price}
                                            readOnly
                                            className="w-full border rounded-lg p-2 bg-gray-100 text-center font-bold text-blue-700 font-mono"
                                        />
                                    </div>
                                </div>

                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition h-[42px]"
                                        title="حذف الصنف"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}


                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedSupplierId}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>➕</span> إضافة صنف آخر
                    </button>

                    <button
                        type="submit"
                        disabled={loading || !selectedSupplierId}
                        className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-xl hover:bg-rose-700 transition disabled:opacity-50 font-black text-lg shadow-md shadow-rose-200"
                    >
                        {loading ? 'جاري الإرسال للتأكيد...' : 'إرسال المرتجع إلى الحسابات 📤'}
                    </button>
                </div>
            </form>
        </div>
    );
}
