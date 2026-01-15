import { getProducts, getStocks, getAgencies, getUsers, getWarehouse, getTransactions, getAllRepStocks, getCustomers, getWarehouses } from "@/lib/actions";
import Link from 'next/link';
import WarehouseOperations from "./warehouse-operations";

export default async function WarehouseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: warehouseId } = await params;

    let warehouse: any = null;
    let allProducts: any[] = [];
    let allStocks: any[] = [];
    let allUsers: any[] = [];
    let transactions: any[] = [];
    let allRepStocks: any[] = [];
    let allCustomers: any[] = [];
    let allWarehouses: any[] = [];

    try {
        warehouse = await getWarehouse(warehouseId);
        // Only fetch others if warehouse exists? No, keep parallelish for simplicity or sequential inside try
        if (warehouse) {
            allProducts = await getProducts();
            allStocks = await getStocks();
            allUsers = await getUsers();
            transactions = await getTransactions(warehouseId);
            allRepStocks = await getAllRepStocks();
            allCustomers = await getCustomers();
            allWarehouses = await getWarehouses();
        }
    } catch (e) { console.error("Warehouse details fetch error:", e); }

    // Map products to convert Decimal to number
    const agencyProducts = allProducts
        .filter((p: any) => p.agencyId === warehouse.agencyId)
        .map((p: any) => ({
            ...p,
            factoryPrice: Number(p.factoryPrice),
            wholesalePrice: Number(p.wholesalePrice),
            retailPrice: Number(p.retailPrice)
        }));

    // Sanitize Stocks to remove Prisma objects/Decimals
    const sanitizedStocks = allStocks.map((s: any) => ({
        warehouseId: s.warehouseId,
        productId: s.productId,
        quantity: s.quantity
    }));

    // Map reps to handle nulls
    const agencyReps = allUsers
        .filter((u: any) => u.role === 'SALES_REPRESENTATIVE' && u.agencyId === warehouse.agencyId)
        .map((u: any) => ({
            ...u,
            agencyId: u.agencyId || undefined,
            pricingType: u.pricingType || undefined,
            warehouseId: u.warehouseId || undefined
        }));

    // Map transactions to the UI format (flattening multi-item transactions if necessary)
    const uiTransactions: any[] = [];
    transactions.forEach((t: any) => {
        if (t.items && t.items.length > 0) {
            t.items.forEach((item: any) => {
                // Determine the correct type based on transaction type and note
                let displayType = t.type;

                if (t.type === 'SALE') {
                    if (t.note && t.note.includes('تحميل للمندوب')) {
                        displayType = 'LOAD_TO_REP';
                    }
                } else if (t.type === 'PURCHASE') {
                    if (t.note && t.note.includes('مرتجع')) {
                        displayType = 'RETURN';
                    } else {
                        displayType = 'SUPPLY';
                    }
                }

                uiTransactions.push({
                    id: `${t.id}-${item.id}`,
                    productId: item.productId,
                    type: displayType,
                    quantityChange: t.type === 'SALE' ? -item.quantity : item.quantity,
                    newQuantity: item.quantity,
                    date: t.createdAt.toISOString(),
                    price: Number(item.price),
                    note: t.note || ''
                });
            });
        }
    });

    // Map Rep Stocks (Sanitized)
    const mappedRepStocks = allRepStocks.map((s: any) => ({
        repId: s.warehouseId,
        productId: s.productId,
        quantity: s.quantity
    }));

    // Map Customers
    const mappedCustomers = allCustomers.map((c: any) => ({
        ...c,
        phone: c.phone || undefined,
        representativeId: c.representativeId || undefined
    }));

    // Stats Calculations
    const totalItems = agencyProducts.length;
    const totalInventoryValue = agencyProducts.reduce((sum: number, p: any) => {
        const qty = allStocks.find((s: any) => s.warehouseId === warehouseId && s.productId === p.id)?.quantity || 0;
        return sum + (qty * p.factoryPrice);
    }, 0);
    const itemsWithStock = agencyProducts.filter((p: any) =>
        (allStocks.find((s: any) => s.warehouseId === warehouseId && s.productId === p.id)?.quantity || 0) > 0
    ).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">إدارة مخزن: {warehouse.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                            مستودع نشط
                        </span>
                        <Link href="/dashboard/warehouses" className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1 font-medium group">
                            <span className="transition-transform group-hover:-translate-x-1">&rarr;</span> القائمة الرئيسية للنماذج
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">📦</div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">إجمالي الأصناف</p>
                        <p className="text-2xl font-black text-gray-900">{totalItems}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">💰</div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">قيمة المخزون الإجمالية</p>
                        <p className="text-2xl font-black text-emerald-700">{totalInventoryValue.toLocaleString('en-US')} <span className="text-sm font-normal text-gray-400">ج.م</span></p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-inner">📊</div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">أصناف متوفرة رصيد</p>
                        <p className="text-2xl font-black text-gray-900">{itemsWithStock} <span className="text-sm font-normal text-gray-400">/ {totalItems}</span></p>
                    </div>
                </div>
            </div>

            {/* Main Operations Component */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <WarehouseOperations
                    warehouseId={warehouseId}
                    agencyProducts={agencyProducts}
                    allStocks={sanitizedStocks}
                    reps={agencyReps}
                    transactions={uiTransactions}
                    allRepStocks={mappedRepStocks}
                    allCustomers={mappedCustomers}
                    warehouses={allWarehouses}
                />
            </div>
        </div>
    );
}
