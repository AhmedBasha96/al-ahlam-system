'use client';

import { useState, useEffect } from "react";
import { recordDirectSale } from "@/lib/actions";
import SalesInvoiceModal from "./sales-invoice-modal";

type Product = {
    id: string;
    name: string;
    wholesalePrice: number;
    retailPrice: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
    wholesaleDiscount: number;
    retailDiscount: number;
    unitsPerCarton: number;
}

type RepStock = {
    productId: string;
    quantity: number;
}

type Customer = {
    id: string;
    name: string;
}

type Props = {
    repId: string;
    repName: string;
    customers: Customer[];
    products: Product[];
    repStocks: RepStock[];
    onClose: () => void;
    initialCustomerId?: string;
    pricingType?: 'WHOLESALE' | 'RETAIL';
}

export default function RecordSaleModal({ repId, repName, customers, products, repStocks, onClose, initialCustomerId, pricingType }: Props) {
    const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || "");
    const [cart, setCart] = useState<{ productId: string, cartons: number, units: number, price: number, originalPrice: number, discountPercentage: number }[]>([]);
    const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'PARTIAL'>('CASH');
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [applyDiscount, setApplyDiscount] = useState(true);

    const calculateItemPrice = (product: Product, cartons: number, units: number) => {
        const isCarton = cartons > 0;
        const basePrice = isCarton
            ? (pricingType === 'RETAIL' ? Number(product.retailPrice) : Number(product.wholesalePrice))
            : (pricingType === 'RETAIL' ? Number(product.unitRetailPrice) : Number(product.unitWholesalePrice));

        const discountPercentage = applyDiscount
            ? (pricingType === 'RETAIL' ? Number(product.retailDiscount) : Number(product.wholesaleDiscount))
            : 0;

        return {
            price: basePrice * (1 - (discountPercentage / 100)),
            originalPrice: basePrice,
            discountPercentage
        };
    };

    // Update cart when applyDiscount toggle changes
    useEffect(() => {
        setCart(prev => prev.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return item;

            const { price, originalPrice, discountPercentage } = calculateItemPrice(product, item.cartons, item.units);

            return {
                ...item,
                price,
                originalPrice,
                discountPercentage
            };
        }));
    }, [applyDiscount, products, pricingType]);

    const availableProducts = products.filter(p => {
        const stock = repStocks.find(s => s.productId === p.id);
        return stock && stock.quantity > 0;
    });

    const handleAddToCart = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        setCart(prev => {
            if (prev.find(item => item.productId === productId)) return prev;

            const { price, originalPrice, discountPercentage } = calculateItemPrice(product, 0, 1);

            return [...prev, { productId, cartons: 0, units: 1, price, originalPrice, discountPercentage }];
        });
    };

    const updateCartItem = (productId: string, field: 'cartons' | 'units', value: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId !== productId) return item;

            const product = products.find(p => p.id === item.productId);
            if (!product) return item;

            let updatedItem = { ...item, [field]: value };
            const upc = product.unitsPerCarton || 1;

            // Smart Rebalancing
            if (field === 'units' && value >= upc) {
                updatedItem.cartons += Math.floor(value / upc);
                updatedItem.units = value % upc;
            }

            // Recalculate price based on new quantities
            const { price, originalPrice, discountPercentage } = calculateItemPrice(product, updatedItem.cartons, updatedItem.units);

            return {
                ...updatedItem,
                price,
                originalPrice,
                discountPercentage
            };
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const totalAmount = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        const upc = product?.unitsPerCarton || 1;
        if (item.cartons > 0) {
            return sum + ((item.cartons + (item.units / upc)) * item.price);
        }
        return sum + (item.units * item.price);
    }, 0);

    const handleSubmit = async () => {
        if (!selectedCustomerId) return alert("يرجى اختيار العميل");
        if (cart.length === 0) return alert("يرجى إضافة أصناف للفاتورة");
        if (paymentType === 'PARTIAL' && (paidAmount <= 0 || paidAmount >= totalAmount)) {
            return alert("يرجى إدخال مبلغ دفع جزئي صحيح");
        }

        setLoading(true);
        const processedItems = cart.map(item => {
            const product = products.find(p => p.id === item.productId);
            const upc = product?.unitsPerCarton || 1;

            let totalUnits = 0;
            let finalUnitPrice = 0;

            if (item.cartons > 0) {
                totalUnits = (item.cartons * upc) + item.units;
                finalUnitPrice = item.price / upc;
            } else {
                totalUnits = item.units;
                finalUnitPrice = item.price;
            }

            return {
                productId: item.productId,
                quantity: totalUnits,
                price: finalUnitPrice,
                originalPrice: item.originalPrice / (item.cartons > 0 ? upc : 1),
                discountPercentage: item.discountPercentage
            };
        });

        const result = await recordDirectSale(
            repId,
            selectedCustomerId,
            processedItems,
            { type: paymentType, paidAmount: paymentType === 'PARTIAL' ? paidAmount : undefined }
        );

        if (result.success) {
            const customer = customers.find(c => c.id === selectedCustomerId);
            setInvoiceData({
                repName,
                customerName: customer?.name,
                items: cart.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    const upc = product?.unitsPerCarton || 1;
                    const totalLineAmount = item.cartons > 0
                        ? (item.cartons + (item.units / upc)) * item.price
                        : item.units * item.price;

                    return {
                        productId: item.productId,
                        productName: product?.name || '',
                        quantity: item.cartons > 0 ? (item.cartons * upc + item.units) : item.units,
                        price: item.price,
                        originalPrice: item.originalPrice,
                        discountPercentage: item.discountPercentage,
                        total: totalLineAmount
                    };
                }),
                paymentInfo: {
                    type: paymentType,
                    paidAmount: paymentType === 'PARTIAL' ? paidAmount : undefined,
                    totalAmount
                }
            });
        } else {
            alert("خطأ: " + result.error);
            setLoading(false);
        }
    };

    if (invoiceData) {
        return (
            <SalesInvoiceModal
                repName={invoiceData.repName}
                customerName={invoiceData.customerName}
                items={invoiceData.items}
                paymentInfo={invoiceData.paymentInfo}
                onClose={() => {
                    onClose();
                    // Using router.refresh() would be better but reloading ensures all state is fresh
                    window.location.reload();
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-600 text-white">
                    <h2 className="text-xl font-black flex items-center gap-2">
                        <span>📝</span> تسجيل فاتورة مبيعات جديدة
                    </h2>
                    <button onClick={onClose} className="text-white/80 hover:text-white text-2xl font-bold">×</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Customer Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">العميل:</label>
                            <select
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                className="w-full border rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">اختر عميل المندوب...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-gray-700 mb-2">إضافة صنف من العهدة:</label>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleAddToCart(e.target.value);
                                            e.target.value = "";
                                        }
                                    }}
                                    className="w-full border rounded-xl p-3 bg-emerald-50 text-emerald-800 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">+ إضافة صنف لسلة...</option>
                                    {availableProducts.map(p => {
                                        const stock = repStocks.find(s => s.productId === p.id)?.quantity || 0;
                                        const upc = p.unitsPerCarton || 1;
                                        return (
                                            <option key={p.id} value={p.id}>{p.name} (متاح: {Math.floor(stock / upc)} ك + {stock % upc} ع)</option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="pt-8">
                                <button
                                    onClick={() => setApplyDiscount(!applyDiscount)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border-2 ${applyDiscount
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-gray-400'
                                        }`}
                                >
                                    <span className="text-xl">{applyDiscount ? '🏷️' : '⚪'}</span>
                                    {applyDiscount ? 'الخصم مفعل' : 'بدون خصم'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cart Table */}
                    <div className="border rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase border-b">
                                <tr>
                                    <th className="p-3">الصنف</th>
                                    <th className="p-3 text-center">الكمية</th>
                                    <th className="p-3 text-center">السعر ({cart.some(i => i.cartons > 0) ? 'متنوع' : 'للعلبة'})</th>
                                    <th className="p-3 text-center">الإجمالي</th>
                                    <th className="p-3 text-center">حذف</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    const max = repStocks.find(s => s.productId === item.productId)?.quantity || 0;
                                    return (
                                        <tr key={item.productId} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-900">{product?.name}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex gap-2">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[8px] text-gray-400">كرتونة</span>
                                                            <input
                                                                type="number"
                                                                value={item.cartons}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    const upc = product?.unitsPerCarton || 1;
                                                                    const requestedTotal = (val * upc) + item.units;
                                                                    if (requestedTotal <= max) {
                                                                        updateCartItem(item.productId, 'cartons', val);
                                                                    }
                                                                }}
                                                                min="0"
                                                                className="w-12 border rounded p-1 text-center font-bold text-emerald-700"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[8px] text-gray-400">علبة</span>
                                                            <input
                                                                type="number"
                                                                value={item.units}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value) || 0;
                                                                    const upc = product?.unitsPerCarton || 1;
                                                                    const requestedTotal = (item.cartons * upc) + val;
                                                                    if (requestedTotal <= max) {
                                                                        updateCartItem(item.productId, 'units', val);
                                                                    }
                                                                }}
                                                                min="0"
                                                                className="w-12 border rounded p-1 text-center font-bold text-emerald-700"
                                                            />
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 mt-0.5">متاح: {Math.floor(max / (product?.unitsPerCarton || 1))} ك + {max % (product?.unitsPerCarton || 1)} ع</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="text-sm font-bold text-gray-700">
                                                        {item.price.toLocaleString()}
                                                        <span className="text-[10px] text-gray-400 block font-normal">({item.cartons > 0 ? 'للكرتونة' : 'للعلبة'})</span>
                                                    </div>
                                                    {item.discountPercentage > 0 && (
                                                        <span className="text-[10px] font-black text-rose-500 mt-0.5">خصم {item.discountPercentage}%</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-center font-black">
                                                {(() => {
                                                    const upc = product?.unitsPerCarton || 1;
                                                    if (item.cartons > 0) {
                                                        return ((item.cartons + (item.units / upc)) * item.price).toLocaleString('en-US');
                                                    }
                                                    return (item.units * item.price).toLocaleString('en-US');
                                                })()}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 transition-colors">🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {cart.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-400 italic">السلة فارغة. أضف بعض الأصناف للبدء.</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 font-black text-lg">
                                <tr>
                                    <td colSpan={3} className="p-4 text-left">الإجمالي:</td>
                                    <td colSpan={2} className="p-4 text-emerald-700">{totalAmount.toLocaleString('en-US')} ج.م</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>💳</span> طريقة الدفع والحالة المالية
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { id: 'CASH', label: 'نقدي (كاش)', color: 'bg-green-600' },
                                { id: 'CREDIT', label: 'آجل (مديونية)', color: 'bg-red-600' },
                                { id: 'PARTIAL', label: 'دفع جزئي', color: 'bg-blue-600' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setPaymentType(type.id as any)}
                                    className={`px-6 py-2 rounded-xl border-2 transition font-bold text-sm ${paymentType === type.id ? `${type.color} text-white border-transparent shadow-md scale-105` : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {paymentType === 'PARTIAL' && (
                            <div className="mt-4 animate-in slide-in-from-top-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المدفوع الآن:</label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                                    className="w-full md:w-48 border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-700"
                                    placeholder="0"
                                />
                                <p className="text-xs text-blue-600 mt-2 font-bold">المتبقي مديونية على العميل: {(totalAmount - paidAmount).toLocaleString('en-US')} ج.م</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-gray-500 font-bold hover:text-gray-700 transition"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || cart.length === 0}
                        className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'جاري التسجيل...' : (
                            <>
                                <span>تأكيد وحفظ الفاتورة</span>
                                <span>📄</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
