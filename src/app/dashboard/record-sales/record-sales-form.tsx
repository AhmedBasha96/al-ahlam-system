'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Product = {
    id: string;
    image: string | null;
    name: string;
    wholesalePrice: number;
    retailPrice: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
    unitsPerCarton: number;
}

type User = {
    id: string;
    name: string;
    role: string;
    pricingType?: string | null;
}

type Customer = {
    id: string;
    name: string;
}

type Stock = {
    warehouseId: string;
    productId: string;
    quantity: number;
}

type OrderItem = {
    productId: string;
    cartons: number;
    units: number;
    price: number;
}

type Props = {
    representatives: User[];
    customers: Customer[];
    products: Product[];
    stocks: Stock[];
    recordSaleAction: (repId: string, customerId: string, items: any[], paymentInfo: any) => Promise<any>;
}

export default function RecordSalesForm({ representatives, customers, products, stocks, recordSaleAction }: Props) {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<OrderItem[]>([{ productId: "", cartons: 0, units: 1, price: 0 }]);
    const [selectedRepId, setSelectedRepId] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'PARTIAL'>('CASH');
    const [paidAmount, setPaidAmount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        if (!selectedRepId) return;
        const selectedRep = representatives.find(r => r.id === selectedRepId);

        setItems(prevItems => prevItems.map(item => {
            if (!item.productId) return item;
            const product = products.find(p => p.id === item.productId);
            if (!product) return item;

            let newPrice = 0;
            if (item.cartons > 0) {
                newPrice = selectedRep?.pricingType === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
            } else {
                newPrice = selectedRep?.pricingType === 'WHOLESALE' ? product.unitWholesalePrice : product.unitRetailPrice;
            }

            return { ...item, price: newPrice };
        }));
    }, [selectedRepId, products, representatives]);

    const handleAddItem = () => {
        setItems([...items, { productId: "", cartons: 0, units: 1, price: 0 }]);
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

        const product = products.find(p => p.id === newItem.productId);
        const selectedRep = representatives.find(r => r.id === selectedRepId);
        const upc = product?.unitsPerCarton || 1;

        // Smart Rebalancing (if units entered, convert to cartons if needed)
        if (field === 'units' && value >= upc && upc > 0) {
            newItem.cartons += Math.floor(value / upc);
            newItem.units = value % upc;
        }

        // 2. Auto-fill price based on the FINAL quantities and rep type
        if (product) {
            if (newItem.cartons > 0) {
                newItem.price = selectedRep?.pricingType === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
            } else {
                newItem.price = selectedRep?.pricingType === 'WHOLESALE' ? product.unitWholesalePrice : product.unitRetailPrice;
            }
        }

        // 3. Stock Calculation & Validation
        const stockEntry = stocks.find(s => s.warehouseId === selectedRepId && s.productId === newItem.productId);
        const totalAvailableUnits = stockEntry?.quantity || 0;
        const totalRequestedUnits = (newItem.cartons * upc) + newItem.units;

        if (totalRequestedUnits > totalAvailableUnits) {
            alert(`الكمية المدخلة تجاوزت المتاح مع المندوب (${Math.floor(totalAvailableUnits / upc)} كرتونة و ${totalAvailableUnits % upc} قطعة)`);
            return;
        }

        newItems[index] = newItem;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            const upc = product?.unitsPerCarton || 1;

            if (item.cartons > 0) {
                const effectiveCartons = item.cartons + (item.units / upc);
                return sum + (effectiveCartons * item.price);
            } else {
                return sum + (item.units * item.price);
            }
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRepId || !selectedCustomerId || items.some(i => !i.productId)) {
            alert("يرجى إكمال جميع البيانات");
            return;
        }

        // Validate stock before submission
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            const upc = product?.unitsPerCarton || 1;
            const stockEntry = stocks.find(s => s.warehouseId === selectedRepId && s.productId === item.productId);
            const totalAvailableUnits = stockEntry?.quantity || 0;
            const totalRequestedUnits = (item.cartons * upc) + item.units;

            if (totalRequestedUnits > totalAvailableUnits) {
                alert(`الكمية المطلوبة من ${product?.name} (${Math.floor(totalRequestedUnits / upc)} كرتونة و ${totalRequestedUnits % upc} قطعة) تتجاوز المتاح مع المندوب (${Math.floor(totalAvailableUnits / upc)} كرتونة و ${totalAvailableUnits % upc} قطعة). يرجى تعديل الكمية.`);
                return;
            }
        }

        setLoading(true);
        try {
            const totalAmount = calculateTotal();
            const finalPaidAmount = paymentType === 'CASH' ? totalAmount : (paymentType === 'CREDIT' ? 0 : paidAmount);

            const processedItems = items.map(item => {
                const product = products.find(p => p.id === item.productId);
                const upc = product?.unitsPerCarton || 1;

                let totalUnits = 0;
                let finalPrice = 0;

                if (item.cartons > 0) {
                    totalUnits = (item.cartons * upc) + item.units;
                    finalPrice = item.price / upc;
                } else {
                    totalUnits = item.units;
                    finalPrice = item.price;
                }

                return {
                    productId: item.productId,
                    quantity: totalUnits,
                    price: finalPrice
                };
            });

            const result = await recordSaleAction(
                selectedRepId,
                selectedCustomerId,
                processedItems,
                { type: paymentType, paidAmount: finalPaidAmount }
            );

            if (result.success) {
                alert("تم تسجيل الفاتورة بنجاح");
                router.refresh();
                setItems([{ productId: "", cartons: 0, units: 0, price: 0 }]);
                setSelectedRepId("");
                setSelectedCustomerId("");
            } else {
                alert(`خطأ: ${result.error}`);
            }
        } catch (error) {
            alert("حدث خطأ أثناء التسجيل");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Select Rep */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">المندوب (البائع)</label>
                    <select
                        value={selectedRepId}
                        onChange={(e) => setSelectedRepId(e.target.value)}
                        className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    >
                        <option value="">اختر المندوب...</option>
                        {representatives.map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.name}</option>
                        ))}
                    </select>
                </div>

                {/* Select Customer */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">العميل (المشتري)</label>
                    <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    >
                        <option value="">اختر العميل...</option>
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
                <h3 className="text-md font-bold text-gray-700 border-b pb-2">تفاصيل الصنف</h3>
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs text-gray-500 mb-1">المنتج</label>
                                <select
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                    required
                                    disabled={!selectedRepId}
                                >
                                    <option value="">اختر المنتج...</option>
                                    {products.map(product => {
                                        const s = stocks.find(stock => stock.warehouseId === selectedRepId && stock.productId === product.id);
                                        const qty = s?.quantity || 0;
                                        const upc = product.unitsPerCarton || 1;
                                        if (qty <= 0) return null;

                                        return (
                                            <option key={product.id} value={product.id}>
                                                {product.name} (المتاح: {Math.floor(qty / upc)} ك + {qty % upc} ق)
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 mb-1">كرتونة</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.cartons}
                                        onChange={(e) => handleItemChange(index, 'cartons', Number(e.target.value))}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                                        required
                                    />
                                </div>

                                <div className="w-24">
                                    <label className="block text-xs text-gray-500 mb-1">قطع</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.units}
                                        onChange={(e) => handleItemChange(index, 'units', Number(e.target.value))}
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="w-32">
                                <label className="block text-xs text-gray-500 mb-1">السعر ({item.cartons > 0 ? 'كرتونة' : 'قطعة'})</label>
                                <input
                                    type="number"
                                    value={item.price}
                                    readOnly
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none text-center bg-gray-100 cursor-not-allowed font-bold"
                                    required
                                />
                            </div>

                            <div className="w-32 pt-6">
                                <div className="text-xs text-gray-400 mb-1">الإجمالي</div>
                                <div className="p-2 font-bold text-emerald-700">
                                    {(() => {
                                        const product = products.find(p => p.id === item.productId);
                                        const upc = product?.unitsPerCarton || 1;
                                        if (item.cartons > 0) {
                                            return ((item.cartons + item.units / upc) * item.price).toLocaleString();
                                        }
                                        return (item.units * item.price).toLocaleString();
                                    })()}
                                </div>
                            </div>

                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                >
                    <span>➕</span> إضافة صنف آخر
                </button>
            </div>

            {/* Payment & Summary */}
            <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="space-y-4 flex-1">
                    <h3 className="font-bold text-gray-700">طريقة الدفع</h3>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentType === 'CASH'}
                                onChange={() => setPaymentType('CASH')}
                                className="w-4 h-4 text-emerald-600"
                            />
                            <span>نقدي (Cash)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentType === 'CREDIT'}
                                onChange={() => setPaymentType('CREDIT')}
                                className="w-4 h-4 text-emerald-600"
                            />
                            <span>آجل (Credit)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="payment"
                                checked={paymentType === 'PARTIAL'}
                                onChange={() => setPaymentType('PARTIAL')}
                                className="w-4 h-4 text-emerald-600"
                            />
                            <span>جزئي</span>
                        </label>
                    </div>

                    {paymentType === 'PARTIAL' && (
                        <div className="max-w-[200px]">
                            <label className="block text-xs text-gray-500 mb-1">المبلغ المدفوع</label>
                            <input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(Number(e.target.value))}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 min-w-[300px] text-right">
                    <div className="text-emerald-800 text-sm mb-2">إجمالي الفاتورة</div>
                    <div className="text-3xl font-black text-emerald-900 mb-4">
                        {calculateTotal().toLocaleString()} <span className="text-sm font-normal">ج.م</span>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 font-bold shadow-lg"
                    >
                        {loading ? 'جاري التسجيل...' : 'تأكيد وحفظ الفاتورة'}
                    </button>
                </div>
            </div>
        </form>
    );
}
