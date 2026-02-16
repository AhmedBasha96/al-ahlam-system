'use client';

import { finalizeRepAudit } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SalesInvoiceModal from "./sales-invoice-modal";

type Product = {
    id: string;
    name: string;
    wholesalePrice: number;
    retailPrice: number;
    unitsPerCarton: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
}

type RepStock = {
    productId: string;
    quantity: number;
}

type Warehouse = {
    id: string;
    name: string;
}

type Props = {
    repId: string;
    repName?: string;
    pricingType?: 'WHOLESALE' | 'RETAIL';
    products: Product[];
    repStocks: RepStock[];
    warehouses: Warehouse[];
    defaultWarehouseId?: string;
    userRole?: string;
}

export default function RepAuditForm({ repId, repName, pricingType, products, repStocks, warehouses, defaultWarehouseId, userRole }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

    // State for audit: actual units remaining
    const [auditData, setAuditData] = useState<{ [productId: string]: { cartons: number, units: number } }>({});
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(defaultWarehouseId || "");
    const [remainingStockAction, setRemainingStockAction] = useState<'RETURN' | 'KEEP'>('KEEP');

    const isRep = userRole === 'SALES_REPRESENTATIVE';
    const [invoiceData, setInvoiceData] = useState<{ sessionId: string, items: any[] } | null>(null);

    // Initialize audit data with current stock (assuming 0 sold initially if not touched?)
    // Actually better to start empty or default to current stock (meaning 0 sold)
    // Let's populate default values on mount or render
    const getActualUnits = (productId: string, currentTotalQty: number) => {
        if (auditData[productId]) {
            const product = products.find(p => p.id === productId);
            const upc = product?.unitsPerCarton || 1;
            return (auditData[productId].cartons * upc) + auditData[productId].units;
        }
        return currentTotalQty;
    };

    const handleUnitChange = (productId: string, field: 'cartons' | 'units', val: number) => {
        const product = products.find(p => p.id === productId);
        const stock = repStocks.find(s => s.productId === productId);
        if (!product || !stock) return;

        setAuditData(prev => {
            const current = prev[productId] || {
                cartons: Math.floor(stock.quantity / (product.unitsPerCarton || 1)),
                units: stock.quantity % (product.unitsPerCarton || 1)
            };
            return {
                ...prev,
                [productId]: { ...current, [field]: val }
            };
        });
    };

    const getPricing = (product: Product) => {
        const effectivePricing = pricingType ?? 'RETAIL';
        if (effectivePricing === 'WHOLESALE') return {
            carton: product.wholesalePrice,
            unit: product.unitWholesalePrice
        };
        return {
            carton: product.retailPrice,
            unit: product.unitRetailPrice
        };
    };

    const calculateTotals = () => {
        let totalSoldAmount = 0;
        let totalItemsSold = 0;
        let totalItemsReturned = 0;
        let totalCustodyValue = 0;
        let totalRemainingValue = 0;

        repStocks.forEach(stock => {
            const product = products.find(p => p.id === stock.productId);
            if (!product) return;

            const upc = product.unitsPerCarton || 1;
            const actualTotal = getActualUnits(stock.productId, stock.quantity);
            const soldTotal = Math.max(0, stock.quantity - actualTotal);

            const pricing = getPricing(product);

            // Calculate sold value accurately: full cartons first, then remaining units
            const soldCartons = Math.floor(soldTotal / upc);
            const soldUnits = soldTotal % upc;
            const soldValue = (soldCartons * pricing.carton) + (soldUnits * pricing.unit);

            totalSoldAmount += soldValue;
            totalItemsSold += soldTotal;
            totalItemsReturned += actualTotal;

            const custodyCartons = Math.floor(stock.quantity / upc);
            const custodyUnits = stock.quantity % upc;
            totalCustodyValue += (custodyCartons * pricing.carton) + (custodyUnits * pricing.unit);

            const remainingCartons = Math.floor(actualTotal / upc);
            const remainingUnits = actualTotal % upc;
            totalRemainingValue += (remainingCartons * pricing.carton) + (remainingUnits * pricing.unit);
        });

        return { totalSoldAmount, totalItemsSold, totalItemsReturned, totalCustodyValue, totalRemainingValue };
    };

    const { totalSoldAmount, totalItemsSold, totalItemsReturned, totalCustodyValue, totalRemainingValue } = calculateTotals();

    const handleFinalize = async () => {
        const targetWarehouseId = defaultWarehouseId || selectedWarehouseId;

        if (!targetWarehouseId) {
            alert("يرجى اختيار المخزن الذي سيتم إرجاع البضاعة المتبقية إليه");
            return;
        }

        // Prepare data
        // We need to send actual quantity for ALL items in custody
        const finalAuditItems = repStocks.map(stock => ({
            productId: stock.productId,
            actualQuantity: getActualUnits(stock.productId, stock.quantity)
        }));

        setLoading(true);
        try {
            // Defaulting to CREDIT for audit sales as per "don't ask for cash/credit"
            const result = await finalizeRepAudit(
                repId,
                targetWarehouseId,
                finalAuditItems,
                { type: 'CREDIT', paidAmount: 0 },
                remainingStockAction
            );
            if (result.success) {
                setInvoiceData({
                    sessionId: result.sessionId || "",
                    items: result.soldItems || []
                });
                setShowInvoice(true);
            } else {
                alert("خطأ أثناء الحفظ: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("حدث خطأ غير متوقع");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {isRep && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm flex items-center gap-3 shadow-sm">
                    <span className="text-xl">⚠️</span>
                    <p className="font-bold">تنبيه: بيانات العهدة في هذا الجدول للمراجعة فقط. عملية تصفية العهدة (الجرد النهائي) تتم من خلال الإدارة فقط.</p>
                </div>
            )}

            {/* Control Panel */}
            {!isRep && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 grid md:grid-cols-2 gap-6 items-center">
                    {!defaultWarehouseId && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">إرجاع المتبقي إلى مخزن:</label>
                            <select
                                value={selectedWarehouseId}
                                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                className="w-full border rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="">اختر المخزن...</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* Action Selection */}
            {!isRep && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-3">
                        <label className="text-sm font-bold text-gray-700 block">الإجراء المتخذ للمتبقي في العهدة:</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRemainingStockAction('KEEP')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${remainingStockAction === 'KEEP'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <span className="text-2xl">🚚</span>
                                <span className="font-bold text-sm">بقاء المتبقي مع المندوب</span>
                                <span className="text-[10px] opacity-70">يستمر המندوب بهذه الكمية للفترة القادمة</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRemainingStockAction('RETURN')}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${remainingStockAction === 'RETURN'
                                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-md'
                                    : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                                    }`}
                            >
                                <span className="text-2xl">🏬</span>
                                <span className="font-bold text-sm">إرجاع المتبقي للمخزن</span>
                                <span className="text-[10px] opacity-70">يتم تصفية عهدة המندوب بالكامل وإرجاعها للمخزن</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 min-w-[250px] flex flex-col justify-center text-center">
                        <div className="text-xs text-emerald-800 mb-1 font-bold">إجمالي المبيعات المستحقة</div>
                        <div className="text-3xl font-black text-emerald-600 font-mono">{totalSoldAmount.toLocaleString('en-US')} <span className="text-sm">ج.م</span></div>
                        <div className="mt-2 text-[10px] text-emerald-600">سيتم إصدار فاتورة مبيعات تلقائياً</div>
                    </div>
                </div>
            )}

            {isRep && (
                <div className="bg-emerald-600 p-8 rounded-2xl shadow-lg border border-emerald-500 flex justify-between items-center text-white">
                    <div>
                        <h3 className="text-xl font-black mb-1">تسجيل جرد بضاعة العهدة</h3>
                        <p className="text-emerald-100 text-sm">قم بتحديث الكميات الفعلية الموجودة معك حالياً وسيقوم النظام بحساب مبيعاتك.</p>
                    </div>
                    <div className="text-left">
                        <div className="text-xs text-emerald-200 font-bold uppercase mb-1">إجمالي المبيعات المستحقة</div>
                        <div className="text-4xl font-black">{totalSoldAmount.toLocaleString('en-US')} <span className="text-lg">ج.م</span></div>
                    </div>
                </div>
            )}

            {/* Audit Table */}
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                        <tr>
                            <th className="p-4 font-semibold">الصنف</th>
                            <th className="p-4 font-semibold text-center">العهدة (المسلم)</th>
                            <th className="p-4 font-semibold text-center w-64">الفعلي (المتبقي)</th>
                            <th className="p-4 font-semibold text-center text-red-600">المباع</th>
                            <th className="p-4 font-semibold text-center">التسعيرة</th>
                            <th className="p-4 font-semibold text-center">قيمة المبيعات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {repStocks.map((stock) => {
                            const product = products.find(p => p.id === stock.productId);
                            if (!product) return null;

                            const upc = product.unitsPerCarton || 1;
                            const actualTotal = getActualUnits(stock.productId, stock.quantity);
                            const soldTotal = Math.max(0, stock.quantity - actualTotal);
                            const pricing = getPricing(product);

                            const soldCartons = Math.floor(soldTotal / upc);
                            const soldUnits = soldTotal % upc;
                            const totalSoldRow = (soldCartons * pricing.carton) + (soldUnits * pricing.unit);

                            const currentData = auditData[stock.productId] || {
                                cartons: Math.floor(stock.quantity / upc),
                                units: stock.quantity % upc
                            };

                            return (
                                <tr key={stock.productId} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{product.name}</div>
                                        <div className="text-[10px] text-gray-400">الكرتونة = {upc} علبة</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-bold text-gray-600">{Math.floor(stock.quantity / upc)} ك + {stock.quantity % upc} ع</div>
                                        <div className="text-[10px] text-gray-400">إجمالي: {stock.quantity}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2 items-center justify-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400">كرتون</span>
                                                <input
                                                    type="number"
                                                    value={currentData.cartons}
                                                    onChange={(e) => handleUnitChange(stock.productId, 'cartons', Number(e.target.value))}
                                                    readOnly={isRep}
                                                    className="w-16 border rounded-lg p-1 text-center font-bold text-emerald-700"
                                                />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] text-gray-400">علبة</span>
                                                <input
                                                    type="number"
                                                    value={currentData.units}
                                                    onChange={(e) => handleUnitChange(stock.productId, 'units', Number(e.target.value))}
                                                    readOnly={isRep}
                                                    className="w-16 border rounded-lg p-1 text-center font-bold text-emerald-700"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`p-4 text-center font-black ${soldTotal > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                                        {soldCartons > 0 && <span>{soldCartons} ك</span>}
                                        {soldCartons > 0 && soldUnits > 0 && <span> + </span>}
                                        {soldUnits > 0 && <span>{soldUnits} ع</span>}
                                        {soldTotal === 0 && <span>0</span>}
                                    </td>
                                    <td className="p-4 text-center text-[10px] text-gray-500 bg-gray-50/50">
                                        <div>ك: {pricing.carton}</div>
                                        <div>ع: {pricing.unit}</div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-900">
                                        {totalSoldRow.toLocaleString('en-US')} ج.م
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                        <tr>
                            <td className="p-4">الإجمالي</td>
                            <td className="p-4 text-center">{repStocks.reduce((a, b) => a + b.quantity, 0)}</td>
                            <td className="p-4 text-center text-gray-400 font-mono italic">{totalCustodyValue.toLocaleString('en-US')}</td>
                            <td className="p-4 text-center">{totalItemsReturned}</td>
                            <td className="p-4 text-center text-blue-700 font-mono">{totalRemainingValue.toLocaleString('en-US')}</td>
                            <td className="p-4 text-center text-red-600">{totalItemsSold}</td>
                            <td colSpan={2} className="p-4 text-center text-emerald-700">{totalSoldAmount.toLocaleString('en-US')} ج.م</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {!isRep && (
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleFinalize}
                        disabled={loading || repStocks.length === 0}
                        className={`text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg disabled:opacity-50 flex items-center gap-3 text-lg ${remainingStockAction === 'KEEP'
                            ? 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02]'
                            : 'bg-amber-600 hover:bg-amber-700 hover:scale-[1.02]'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">جاري المعالجة...</span>
                        ) : (
                            <>
                                {remainingStockAction === 'KEEP' ? '📦 اعتماد المبيعات وبقاء العهدة' : '🏬 اعتماد المبيعات وتصفية العهدة'}
                                <span className="text-xl">🚀</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {showInvoice && invoiceData && (
                <SalesInvoiceModal
                    repName={repName || "مندوب مبيعات"}
                    customerName={`تصفية عهدة - ${repName}`}
                    paymentInfo={{
                        type: 'CREDIT',
                        paidAmount: 0,
                        totalAmount: totalSoldAmount
                    }}
                    items={invoiceData.items}
                    onClose={() => {
                        setShowInvoice(false);
                        router.refresh();
                        router.push('/dashboard/reports/sales');
                    }}
                />
            )}
        </div>
    );
}
