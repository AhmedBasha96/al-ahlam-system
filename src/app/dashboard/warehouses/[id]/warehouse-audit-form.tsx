'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { performWarehouseAudit } from "@/lib/actions";

type Product = {
    id: string;
    image: string | null;
    name: string;
    wholesalePrice: number;
    retailPrice: number;
    factoryPrice: number;
    unitsPerCarton: number;
    unitWholesalePrice: number;
    unitRetailPrice: number;
    unitFactoryPrice: number;
    agencyId: string;
}

type Stock = {
    productId: string;
    quantity: number;
}

type Props = {
    warehouseId: string;
    products: Product[];
    stocks: Stock[];
}

export default function WarehouseAuditForm({ warehouseId, products, stocks }: Props) {
    const router = useRouter();
    const [auditData, setAuditData] = useState<Record<string, number>>(
        Object.fromEntries(stocks.map(s => [s.productId, s.quantity]))
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleInputChange = (productId: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setAuditData(prev => ({ ...prev, [productId]: numValue }));
    };

    const handleConfirmAudit = async () => {
        if (!confirm("هل أنت متأكد من تأكيد الجرد الفعلي للمخزن؟ سيتم تعديل رصيد المخزن بناءً على الكميات الحالية.")) return;

        setLoading(true);
        setMessage(null);

        const data = Object.entries(auditData).map(([productId, actualQuantity]) => ({
            productId,
            actualQuantity
        }));

        const result = await performWarehouseAudit(warehouseId, data);

        if (result.success) {
            setMessage({ type: 'success', text: 'تم تحديث جرد المخزن بنجاح وتسجيل التسويات.' });
            router.refresh();
        } else {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الجرد: ' + result.error });
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                    <h3 className="font-bold text-gray-800">الجرد الفعلي للمخزن</h3>
                    <p className="text-xs text-gray-500">قم بمطابقة الكميات الموجودة في المخزن حالياً مع الرصيد الدفتري.</p>
                </div>
                <button
                    onClick={handleConfirmAudit}
                    disabled={loading}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-md"
                >
                    {loading ? 'جاري الحفظ...' : 'تأكيد الحفظ والتسوية 💾'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 border-b border-gray-100 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">الصنف</th>
                            <th className="p-4 text-center">الرصيد الدفتري (الحالي)</th>
                            <th className="p-4 text-center">الرصيد الفعلي (الموجود)</th>
                            <th className="p-4 text-center">الفرق (عجز / زيادة)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map(product => {
                            const bookQty = stocks.find(s => s.productId === product.id)?.quantity || 0;
                            const physicalQty = auditData[product.id] ?? bookQty;
                            const diff = physicalQty - bookQty;

                            return (
                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-gray-300">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="text-[10px] text-gray-400 font-mono">{product.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-500">
                                        {bookQty}
                                    </td>
                                    <td className="p-4 text-center">
                                        <input
                                            type="number"
                                            value={physicalQty}
                                            onChange={(e) => handleInputChange(product.id, e.target.value)}
                                            step="1"
                                            min="0"
                                            className="w-24 border rounded-lg p-2 text-center focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-700 bg-emerald-50/20"
                                        />
                                    </td>
                                    <td className={`p-4 text-center font-black ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                                        {diff === 0 ? '-' : diff > 0 ? `+${diff}` : diff}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
