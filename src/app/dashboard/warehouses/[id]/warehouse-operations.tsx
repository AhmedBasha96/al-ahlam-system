'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoadStockForm from "./load-stock-form";
import { updateStock, supplyStock } from "@/lib/actions";
import WarehouseAuditForm from "./warehouse-audit-form";
import RepAuditForm from "../../reps/[id]/rep-audit-form";
import { OpeningStockModal } from "@/components/inventory/opening-stock-modal";

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
    priceUpdatedAt?: string;
    agency?: { id: string, name: string };
    supplier?: { id: string, name: string };
}

type RepStock = {
    repId: string;
    productId: string;
    quantity: number;
}

type Stock = {
    warehouseId: string;
    productId: string;
    quantity: number;
}

type User = {
    id: string;
    name: string;
    role: string;
    pricingType?: 'WHOLESALE' | 'RETAIL';
    agencyId?: string;
}

type Customer = {
    id: string;
    name: string;
    phone?: string;
    representativeId?: string;
}

type Transaction = {
    id: string;
    baseId: string;
    productId: string;
    type: 'SUPPLY' | 'LOAD_TO_REP' | 'RETURN' | 'ADJUSTMENT' | 'PURCHASE' | 'SALE' | 'INITIAL_STOCK';
    rawType: string;
    quantityChange: number;
    newQuantity: number;
    date: string;
    price?: number;
    note?: string;
    partyName: string;
    userName: string;
    items: any[];
    paymentInfo: any;
}

type Props = {
    warehouseId: string;
    agencyProducts: Product[];
    allStocks: Stock[];
    reps: User[];
    transactions: Transaction[];
    allRepStocks: RepStock[];
    allCustomers: Customer[];
    warehouses: { id: string, name: string }[];
    userRole?: string;
}

import { updateTransaction } from "@/lib/actions";
import TransactionModal from "@/components/shared/transaction-modal";
import { formatUnits, cn } from "@/lib/utils";

export default function WarehouseOperations({
    warehouseId,
    agencyProducts,
    allStocks,
    reps,
    transactions,
    allRepStocks,
    allCustomers,
    warehouses,
    userRole
}: Props) {
    const [activeTab, setActiveTab] = useState<'inventory' | 'loading' | 'history' | 'rep-audit'>('inventory');
    const [selectedRepId, setSelectedRepId] = useState<string>("");
    const [supplyModeProductId, setSupplyModeProductId] = useState<string | null>(null);

    // Filter states for Transaction History
    const [historySearch, setHistorySearch] = useState("");
    const [historyType, setHistoryType] = useState<string>("ALL");
    const [historyProduct, setHistoryProduct] = useState<string>("ALL");
    const [historyStartDate, setHistoryStartDate] = useState("");
    const [historyEndDate, setHistoryEndDate] = useState("");

    const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const router = useRouter();

    const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SECURITY';

    return (
        <div className="space-y-6">
            {/* Tabs Navigation */}
            {/* ... (keep existing tabs) ... */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'inventory'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    مخزون المنتجات (Stock)
                </button>
                <button
                    onClick={() => setActiveTab('loading')}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'loading'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    تحميل المناديب (إذن صرف)
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'history'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    سجل الحركات (History)
                </button>
                <button
                    onClick={() => setActiveTab('rep-audit')}
                    className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${activeTab === 'rep-audit'
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    جرد المناديب (مبيعات)
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'inventory' ? (
                    /* ... inventory table (keep existing) ... */
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                        <table className="w-full text-right">
                            <thead className="bg-emerald-50 text-emerald-900 border-b border-emerald-100">
                                <tr>
                                    <th className="p-4 font-semibold text-right">الصنف / المورد</th>
                                    <th className="p-4 font-semibold text-center">التوكيل</th>
                                    <th className="p-4 font-semibold text-center">سعر الجمله</th>
                                    <th className="p-4 font-semibold text-center">سعر القطاعي</th>
                                    <th className="p-4 font-semibold text-center">الكميه المتاحه</th>
                                    <th className="p-4 font-semibold text-center">تاريخ اخر تحديث للسعر</th>
                                    <th className="p-4 font-semibold text-center w-[150px]">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {agencyProducts.map(product => {
                                    const stockEntry = allStocks.find(s => s.warehouseId === warehouseId && s.productId === product.id);
                                    const currentStock = stockEntry?.quantity || 0;
                                    const isSupplying = supplyModeProductId === product.id;

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
                                                    <div className="flex flex-col">
                                                        <div className="font-bold text-gray-800">{product.name}</div>
                                                        <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md inline-block self-start mt-1">
                                                            {product.supplier?.name || "بدون مورد"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                    {product.agency?.name || "بدون توكيل"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 text-center font-mono">{product.wholesalePrice.toLocaleString('en-US')} ج.م</td>
                                            <td className="p-4 text-gray-600 text-center font-mono">{product.retailPrice.toLocaleString('en-US')} ج.م</td>
                                            <td className="p-4 text-center">
                                                {currentStock === 0 ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-500 font-bold text-sm border border-red-100">
                                                        نفذ المخزون
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                                            {product.unitsPerCarton > 1 && Math.floor(currentStock / product.unitsPerCarton) > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-sm shadow-sm">
                                                                    <span>{Math.floor(currentStock / product.unitsPerCarton)}</span>
                                                                    <span className="text-emerald-200 text-xs">كرتونة</span>
                                                                </span>
                                                            )}
                                                            {(product.unitsPerCarton <= 1 || currentStock % product.unitsPerCarton > 0 || Math.floor(currentStock / product.unitsPerCarton) === 0) && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-200">
                                                                    <span>{product.unitsPerCarton <= 1 ? currentStock : currentStock % product.unitsPerCarton}</span>
                                                                    <span className="text-emerald-500 text-xs">علبة</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400">
                                                            {currentStock} إجمالي
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center text-xs text-gray-500 font-medium">
                                                {product.priceUpdatedAt ? (
                                                    <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded inline-block">
                                                        {new Date(product.priceUpdatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 italic">غير محدد</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {!transactions.some(t => t.productId === product.id && t.type === 'INITIAL_STOCK') && (
                                                    <OpeningStockModal warehouseId={warehouseId} product={product} />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'loading' ? (
                    <div className="max-w-4xl mx-auto">
                        <LoadStockForm warehouseId={warehouseId} products={agencyProducts} reps={reps} stocks={allStocks} />
                    </div>
                ) : activeTab === 'rep-audit' ? (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                            <label className="block text-sm font-medium text-gray-700 mb-2">اختر المندوب للبدء بالجرد:</label>
                            <select
                                value={selectedRepId}
                                onChange={(e) => setSelectedRepId(e.target.value)}
                                className="w-full md:w-64 border rounded-lg p-2.5 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                            >
                                <option value="">إختر مندوب...</option>
                                {reps.map(rep => (
                                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedRepId ? (
                            <RepAuditForm
                                repId={selectedRepId}
                                repName={reps.find(r => r.id === selectedRepId)?.name}
                                pricingType={reps.find(r => r.id === selectedRepId)?.pricingType}
                                products={agencyProducts}
                                repStocks={allRepStocks.filter(s => s.repId === selectedRepId)}
                                warehouses={warehouses}
                                defaultWarehouseId={warehouseId}
                            />
                        ) : (
                            <div className="p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                                يرجي اختيار مندوب من القائمة أعلاه لعرض عهدته والبدء في الجرد
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Transaction Filters */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-bold text-gray-500 mb-1">بحث في الملاحظات</label>
                                <input
                                    type="text"
                                    placeholder="بحث بكلمة..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="w-40">
                                <label className="block text-xs font-bold text-gray-500 mb-1">نوع الحركة</label>
                                <select
                                    value={historyType}
                                    onChange={(e) => setHistoryType(e.target.value)}
                                    className="w-full border rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="ALL">جميع الحركات</option>
                                    <option value="SUPPLY">توريد</option>
                                    <option value="LOAD_TO_REP">صرف للمندوب</option>
                                    <option value="RETURN">مرتجع</option>
                                    <option value="ADJUSTMENT">تعديل (جرد)</option>
                                </select>
                            </div>
                            <div className="w-48">
                                <label className="block text-xs font-bold text-gray-500 mb-1">فلترة بالمنتج</label>
                                <select
                                    value={historyProduct}
                                    onChange={(e) => setHistoryProduct(e.target.value)}
                                    className="w-full border rounded-lg px-2 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="ALL">جميع المنتجات</option>
                                    {agencyProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">من تاريخ</label>
                                    <input
                                        type="date"
                                        value={historyStartDate}
                                        onChange={(e) => setHistoryStartDate(e.target.value)}
                                        className="border rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">إلى تاريخ</label>
                                    <input
                                        type="date"
                                        value={historyEndDate}
                                        onChange={(e) => setHistoryEndDate(e.target.value)}
                                        className="border rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setHistorySearch("");
                                    setHistoryType("ALL");
                                    setHistoryProduct("ALL");
                                    setHistoryStartDate("");
                                    setHistoryEndDate("");
                                }}
                                className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 text-gray-600 h-[38px] transition-colors"
                                title="إعادة تعيين"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-right">
                                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 font-semibold">التاريخ والوقت</th>
                                        <th className="p-4 font-semibold">الصنف</th>
                                        <th className="p-4 font-semibold">النوع</th>
                                        <th className="p-4 font-semibold text-center">الكمية</th>
                                        <th className="p-4 font-semibold text-center">السعر</th>
                                        <th className="p-4 font-semibold text-center">الإجمالي</th>
                                        <th className="p-4 font-semibold">الرصيد بعد الحركة</th>
                                        <th className="p-4 font-semibold">ملاحظات</th>
                                        <th className="p-4 font-semibold text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        const filtered = transactions.filter(t => {
                                            const product = agencyProducts.find(p => p.id === t.productId);
                                            const matchesSearch = !historySearch ||
                                                (t.note?.toLowerCase().includes(historySearch.toLowerCase())) ||
                                                (product?.name?.toLowerCase().includes(historySearch.toLowerCase()));

                                            const matchesType = historyType === 'ALL' || t.type === historyType;
                                            const matchesProduct = historyProduct === 'ALL' || t.productId === historyProduct;

                                            let matchesStart = true;
                                            if (historyStartDate) {
                                                const txDate = new Date(t.date).toISOString().split('T')[0];
                                                matchesStart = txDate >= historyStartDate;
                                            }

                                            let matchesEnd = true;
                                            if (historyEndDate) {
                                                const txDate = new Date(t.date).toISOString().split('T')[0];
                                                matchesEnd = txDate <= historyEndDate;
                                            }

                                            return matchesSearch && matchesType && matchesProduct && matchesStart && matchesEnd;
                                        });

                                        if (filtered.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={9} className="p-12 text-center text-gray-400">لا توجد حركات تطابق الفلترة المختارة.</td>
                                                </tr>
                                            );
                                        }

                                        return filtered.map(t => {
                                            const product = agencyProducts.find(p => p.id === t.productId);
                                            return (
                                                <tr key={t.id} className="group hover:bg-gray-50 transition-all">
                                                    <td className="p-4 text-sm text-gray-500 font-mono">
                                                        {new Date(t.date).toLocaleString('ar-EG', {
                                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                                {product?.image ? (
                                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-gray-300">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="font-medium">{product?.name || t.productId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-xs font-bold">
                                                        {t.type === 'SUPPLY' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">توريد</span>}
                                                        {t.type === 'LOAD_TO_REP' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">صرف للمندوب</span>}
                                                        {t.type === 'ADJUSTMENT' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">تعديل</span>}
                                                        {t.type === 'RETURN' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">مرتجع</span>}
                                                        {t.type === 'PURCHASE' && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded">توريد</span>}
                                                        {t.type === 'SALE' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">صرف</span>}
                                                        {t.type === 'INITIAL_STOCK' && <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded">بضاعة أول المدة</span>}
                                                    </td>
                                                    <td className={`p-4 text-center font-bold ${t.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                                                    </td>
                                                    <td className="p-4 text-center text-gray-600 font-mono">
                                                        {t.price ? `${t.price.toLocaleString('en-US')} ج.م` : '-'}
                                                    </td>
                                                    <td className="p-4 text-center font-bold text-gray-900">
                                                        {t.price ? `${(Math.abs(t.quantityChange) * t.price).toLocaleString('en-US')} ج.م` : '-'}
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-gray-700">{t.newQuantity}</td>
                                                    <td className="p-4 text-sm text-gray-600">{t.note}</td>
                                                    <td className="p-4 text-center">
                                                        {t.baseId && (
                                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={() => setViewingTx(t)}
                                                                    className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-slate-800 transition shadow-sm"
                                                                >
                                                                    فاتورة 📄
                                                                </button>
                                                                {canEdit && (t.rawType === 'SALE' || t.rawType === 'PURCHASE' || t.rawType === 'RETURN_IN' || t.rawType === 'RETURN_OUT') && (
                                                                    <button
                                                                        onClick={() => setEditingTx(t)}
                                                                        className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition shadow-sm"
                                                                    >
                                                                        تعديل ✏️
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {viewingTx && (
                <TransactionModal
                    id={viewingTx.baseId}
                    partyName={viewingTx.partyName}
                    userName={viewingTx.userName}
                    items={viewingTx.items}
                    paymentInfo={viewingTx.paymentInfo}
                    date={viewingTx.date}
                    onClose={() => setViewingTx(null)}
                    type={viewingTx.rawType as any}
                />
            )}

            {editingTx && (
                <TransactionModal
                    id={editingTx.baseId}
                    partyName={editingTx.partyName}
                    userName={editingTx.userName}
                    items={editingTx.items}
                    paymentInfo={editingTx.paymentInfo}
                    date={editingTx.date}
                    editable={true}
                    onUpdate={updateTransaction}
                    onClose={() => {
                        setEditingTx(null);
                        window.location.reload();
                    }}
                    type={editingTx.rawType as any}
                />
            )}
        </div>
    );
}
